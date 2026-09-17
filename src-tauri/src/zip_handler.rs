use std::collections::BTreeSet;
use std::fs::File;
use std::io::Read;
use std::path::{Path, PathBuf};
use crate::EntryItem;

/// Separator for virtual ZIP paths: `{zip_file_path}::{inner_path}`
pub const ZIP_PATH_SEPARATOR: &str = "::";

/// Checks if a file path has a ZIP or CBZ extension.
pub fn is_zip_file(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| {
            let ext = ext.to_lowercase();
            ext == "zip" || ext == "cbz"
        })
        .unwrap_or(false)
}

/// Checks if a path string is a ZIP virtual path or references a ZIP file directly.
pub fn is_zip_path(path_str: &str) -> bool {
    if path_str.contains(ZIP_PATH_SEPARATOR) {
        return true;
    }
    let p = Path::new(path_str);
    is_zip_file(p)
}

/// Parses a path string into (zip_file_path, inner_relative_path).
/// Example: "C:/archive.zip::images/01.jpg" -> (PathBuf("C:/archive.zip"), "images/01.jpg")
/// Example: "C:/archive.zip" -> (PathBuf("C:/archive.zip"), "")
pub fn parse_zip_path(path_str: &str) -> Option<(PathBuf, String)> {
    if let Some(idx) = path_str.find(ZIP_PATH_SEPARATOR) {
        let zip_part = &path_str[..idx];
        let inner_part = &path_str[idx + ZIP_PATH_SEPARATOR.len()..];
        let cleaned_inner = inner_part.trim_matches(['/', '\\']).replace('\\', "/");
        Some((PathBuf::from(zip_part), cleaned_inner))
    } else {
        let p = Path::new(path_str);
        if is_zip_file(p) {
            Some((p.to_path_buf(), String::new()))
        } else {
            None
        }
    }
}

/// Formats a virtual ZIP path from a ZIP file path and inner relative path.
pub fn make_zip_path(zip_path: &Path, inner_path: &str) -> String {
    let zip_str = zip_path.to_string_lossy();
    let cleaned = inner_path.trim_matches(['/', '\\']).replace('\\', "/");
    if cleaned.is_empty() {
        zip_str.to_string()
    } else {
        format!("{}{}{}", zip_str, ZIP_PATH_SEPARATOR, cleaned)
    }
}

/// Helper to check if an inner entry name represents an image file.
pub fn is_supported_image_name(name: &str) -> bool {
    let p = Path::new(name);
    crate::is_image(p)
}

/// Guess MIME type from file extension
pub fn guess_image_mime(name: &str) -> &'static str {
    let ext = Path::new(name)
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .unwrap_or_default();
    
    match ext.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "bmp" => "image/bmp",
        "ico" => "image/x-icon",
        "tiff" | "tif" => "image/tiff",
        "svg" => "image/svg+xml",
        _ => "application/octet-stream",
    }
}

/// Converts a zip::DateTime into a millisecond timestamp using chrono.
pub fn zip_datetime_to_timestamp(dt: zip::DateTime) -> Option<u64> {
    chrono::NaiveDate::from_ymd_opt(dt.year() as i32, dt.month() as u32, dt.day() as u32)?
        .and_hms_opt(dt.hour() as u32, dt.minute() as u32, dt.second() as u32)
        .map(|naive| naive.and_utc().timestamp_millis().max(0) as u64)
}

/// Natural comparison between two strings, treating embedded numbers as integers.
pub fn natural_cmp(a: &str, b: &str) -> std::cmp::Ordering {
    let mut a_chars = a.chars().peekable();
    let mut b_chars = b.chars().peekable();

    loop {
        match (a_chars.peek(), b_chars.peek()) {
            (None, None) => return std::cmp::Ordering::Equal,
            (None, Some(_)) => return std::cmp::Ordering::Less,
            (Some(_), None) => return std::cmp::Ordering::Greater,
            (Some(ca), Some(cb)) => {
                if ca.is_ascii_digit() && cb.is_ascii_digit() {
                    let mut num_a: u64 = 0;
                    while let Some(c) = a_chars.peek() {
                        if c.is_ascii_digit() {
                            num_a = num_a.saturating_mul(10).saturating_add(c.to_digit(10).unwrap() as u64);
                            a_chars.next();
                        } else {
                            break;
                        }
                    }

                    let mut num_b: u64 = 0;
                    while let Some(c) = b_chars.peek() {
                        if c.is_ascii_digit() {
                            num_b = num_b.saturating_mul(10).saturating_add(c.to_digit(10).unwrap() as u64);
                            b_chars.next();
                        } else {
                            break;
                        }
                    }

                    let ord = num_a.cmp(&num_b);
                    if ord != std::cmp::Ordering::Equal {
                        return ord;
                    }
                } else {
                    let ord = ca.to_ascii_lowercase().cmp(&cb.to_ascii_lowercase());
                    if ord != std::cmp::Ordering::Equal {
                        return ord;
                    }
                    a_chars.next();
                    b_chars.next();
                }
            }
        }
    }
}

/// Score an entry name to prioritize cover images (cover > title > others).
fn cover_priority_score(name: &str) -> u32 {
    let lower = name.to_lowercase();
    let stem = Path::new(&lower).file_stem().and_then(|s| s.to_str()).unwrap_or("");
    if stem.contains("cover") {
        0
    } else if stem.contains("title") {
        1
    } else {
        2
    }
}

/// Decodes a raw entry name from a ZIP file.
/// First attempts strict UTF-8 decoding; if invalid, falls back to Shift_JIS (CP932).
pub fn decode_entry_name(raw: &[u8]) -> String {
    match std::str::from_utf8(raw) {
        Ok(valid_utf8) => valid_utf8.to_string(),
        Err(_) => {
            let (decoded, _, _) = encoding_rs::SHIFT_JIS.decode(raw);
            decoded.into_owned()
        }
    }
}

/// Searches for an entry by path in the ZIP archive, matching against decoded names.
pub fn find_entry_index<R: Read + std::io::Seek>(archive: &mut zip::ZipArchive<R>, target_path: &str) -> Option<usize> {
    let normalized_target = target_path.trim_matches(['/', '\\']).replace('\\', "/");
    let lower_target = normalized_target.to_lowercase();
    
    let mut case_insensitive_match = None;
    for i in 0..archive.len() {
        if let Ok(entry) = archive.by_index(i) {
            let decoded = decode_entry_name(entry.name_raw()).replace('\\', "/");
            let normalized_decoded = decoded.trim_matches(['/', '\\']).to_string();
            if normalized_decoded == normalized_target {
                return Some(i);
            }
            if case_insensitive_match.is_none() && normalized_decoded.to_lowercase() == lower_target {
                case_insensitive_match = Some(i);
            }
        }
    }
    case_insensitive_match
}

/// Lists entries inside a ZIP file under the specified sub-directory.
/// Recreates directory hierarchy similar to filesystem reading.
pub fn list_zip_entries(
    zip_path: &Path,
    sub_dir: &str,
    cache_dir: Option<&Path>,
) -> Result<Vec<EntryItem>, String> {
    let file = File::open(zip_path).map_err(|e| format!("Failed to open ZIP file: {}", e))?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| format!("Invalid ZIP archive: {}", e))?;

    let prefix = if sub_dir.is_empty() {
        String::new()
    } else {
        let mut p = sub_dir.trim_matches(['/', '\\']).replace('\\', "/");
        p.push('/');
        p
    };

    let mut direct_dirs = BTreeSet::new();
    let mut direct_files = Vec::new();

    for i in 0..archive.len() {
        let entry = archive.by_index(i).map_err(|e| format!("Failed to read entry {}: {}", i, e))?;
        let entry_name = decode_entry_name(entry.name_raw()).replace('\\', "/");

        // Filter for items inside the requested sub_dir
        if !prefix.is_empty() && !entry_name.starts_with(&prefix) {
            continue;
        }

        let rel_name = if prefix.is_empty() {
            &entry_name[..]
        } else {
            &entry_name[prefix.len()..]
        };

        if rel_name.is_empty() {
            continue;
        }

        // Check if this item is in a sub-folder
        if let Some(slash_idx) = rel_name.find('/') {
            let dir_name = &rel_name[..slash_idx];
            if !dir_name.is_empty() {
                direct_dirs.insert(dir_name.to_string());
            }
        } else if !entry.is_dir() && is_supported_image_name(rel_name) {
            let size = Some(entry.size());
            let modified = entry.last_modified().and_then(zip_datetime_to_timestamp);
            direct_files.push((rel_name.to_string(), size, modified));
        }
    }

    let mut result = Vec::new();

    // Add sub-directories first (sorted naturally)
    let mut sorted_dirs: Vec<String> = direct_dirs.into_iter().collect();
    sorted_dirs.sort_by(|a, b| natural_cmp(a, b));

    for dir_name in sorted_dirs {
        let inner_dir_path = if prefix.is_empty() {
            dir_name.clone()
        } else {
            format!("{}{}", prefix, dir_name)
        };
        let full_virtual_path = make_zip_path(zip_path, &inner_dir_path);

        result.push(EntryItem {
            name: dir_name,
            path: full_virtual_path,
            is_dir: true,
            is_archive: Some(false),
            thumbnail_path: None,
            size: None,
            modified: None,
            created: None,
        });
    }

    // Sort direct files naturally
    direct_files.sort_by(|(a, _, _), (b, _, _)| natural_cmp(a, b));

    // Add image files
    for (file_name, size, modified) in direct_files {

        let inner_file_path = if prefix.is_empty() {
            file_name.clone()
        } else {
            format!("{}{}", prefix, file_name)
        };
        let full_virtual_path = make_zip_path(zip_path, &inner_file_path);

        // Check thumbnail cache if available
        let thumbnail_path = cache_dir.and_then(|cdir| {
            crate::thumbnail::get_cached_zip_thumbnail_path(cdir, zip_path, &inner_file_path)
        }).map(|p| p.to_string_lossy().to_string());

        result.push(EntryItem {
            name: file_name,
            path: full_virtual_path,
            is_dir: false,
            is_archive: Some(false),
            thumbnail_path,
            size,
            modified,
            created: None,
        });
    }

    Ok(result)
}

/// Reads the raw uncompressed bytes of a specific image inside a ZIP file.
pub fn read_zip_entry_bytes(zip_path: &Path, inner_path: &str) -> Result<(Vec<u8>, &'static str), String> {
    let file = File::open(zip_path).map_err(|e| format!("Failed to open ZIP file: {}", e))?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| format!("Invalid ZIP archive: {}", e))?;

    let normalized_inner = inner_path.trim_matches(['/', '\\']).replace('\\', "/");
    let entry_idx = find_entry_index(&mut archive, &normalized_inner).ok_or_else(|| {
        format!("File '{}' not found in ZIP archive", normalized_inner)
    })?;

    let mut entry = archive.by_index(entry_idx).map_err(|e| {
        format!("Failed to open entry {}: {}", entry_idx, e)
    })?;

    let mut bytes = Vec::with_capacity(entry.size() as usize);
    entry.read_to_end(&mut bytes).map_err(|e| format!("Failed to read ZIP entry: {}", e))?;

    let mime = guess_image_mime(&normalized_inner);
    Ok((bytes, mime))
}

/// Finds and reads the first image in the ZIP file (used as the cover thumbnail).
pub fn read_first_image_bytes(zip_path: &Path) -> Result<(Vec<u8>, String, &'static str), String> {
    let file = File::open(zip_path).map_err(|e| format!("Failed to open ZIP file: {}", e))?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| format!("Invalid ZIP archive: {}", e))?;

    let mut image_candidates: Vec<(usize, String)> = Vec::new();
    for i in 0..archive.len() {
        if let Ok(entry) = archive.by_index(i) {
            let decoded_name = decode_entry_name(entry.name_raw()).replace('\\', "/");
            if !entry.is_dir() && is_supported_image_name(&decoded_name) {
                image_candidates.push((i, decoded_name));
            }
        }
    }

    if image_candidates.is_empty() {
        return Err("No supported images found in ZIP archive".to_string());
    }

    image_candidates.sort_by(|(_, a), (_, b)| {
        let score_a = cover_priority_score(a);
        let score_b = cover_priority_score(b);
        if score_a != score_b {
            score_a.cmp(&score_b)
        } else {
            natural_cmp(a, b)
        }
    });

    let (first_idx, first_name) = &image_candidates[0];

    let mut entry = archive.by_index(*first_idx).map_err(|e| {
        format!("Failed to open first image entry at index {}: {}", first_idx, e)
    })?;

    let mut bytes = Vec::with_capacity(entry.size() as usize);
    entry.read_to_end(&mut bytes).map_err(|e| format!("Failed to read first image: {}", e))?;

    let mime = guess_image_mime(first_name);
    Ok((bytes, first_name.clone(), mime))
}


#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use zip::write::SimpleFileOptions;

    fn create_test_zip() -> tempfile::NamedTempFile {
        let temp_file = tempfile::NamedTempFile::new().unwrap();
        let mut zip = zip::ZipWriter::new(temp_file.as_file());

        let options = SimpleFileOptions::default()
            .compression_method(zip::CompressionMethod::Deflated);

        // Add folder1/01.png
        zip.start_file("folder1/01.png", options).unwrap();
        zip.write_all(b"fake png data 1").unwrap();

        // Add folder1/02.jpg
        zip.start_file("folder1/02.jpg", options).unwrap();
        zip.write_all(b"fake jpg data 2").unwrap();

        // Add root_image.jpg
        zip.start_file("root_image.jpg", options).unwrap();
        zip.write_all(b"fake root image data").unwrap();

        // Add text.txt (non-image)
        zip.start_file("text.txt", options).unwrap();
        zip.write_all(b"text file").unwrap();

        zip.finish().unwrap();
        temp_file
    }

    #[test]
    fn test_is_zip_file() {
        assert!(is_zip_file(Path::new("book.zip")));
        assert!(is_zip_file(Path::new("comic.cbz")));
        assert!(is_zip_file(Path::new("UPPER.ZIP")));
        assert!(!is_zip_file(Path::new("image.png")));
        assert!(!is_zip_file(Path::new("archive.tar.gz")));
    }

    #[test]
    fn test_parse_and_make_zip_path() {
        let zip_p = Path::new("C:/manga/vol1.zip");
        let formatted = make_zip_path(zip_p, "ch1/01.jpg");
        assert_eq!(formatted, "C:/manga/vol1.zip::ch1/01.jpg");

        let (parsed_zip, parsed_inner) = parse_zip_path(&formatted).unwrap();
        assert_eq!(parsed_zip, PathBuf::from("C:/manga/vol1.zip"));
        assert_eq!(parsed_inner, "ch1/01.jpg");

        let (parsed_root_zip, parsed_root_inner) = parse_zip_path("C:/manga/vol1.zip").unwrap();
        assert_eq!(parsed_root_zip, PathBuf::from("C:/manga/vol1.zip"));
        assert_eq!(parsed_root_inner, "");
    }

    #[test]
    fn test_decode_entry_name() {
        let utf8_bytes = "こんにちは.png".as_bytes();
        assert_eq!(decode_entry_name(utf8_bytes), "こんにちは.png");

        let (sjis_bytes, _, _) = encoding_rs::SHIFT_JIS.encode("ゲーム.jpg");
        assert_eq!(decode_entry_name(&sjis_bytes), "ゲーム.jpg");
    }


    #[test]
    fn test_natural_cmp() {
        assert_eq!(natural_cmp("1.jpg", "2.jpg"), std::cmp::Ordering::Less);
        assert_eq!(natural_cmp("2.jpg", "10.jpg"), std::cmp::Ordering::Less);
        assert_eq!(natural_cmp("10.jpg", "2.jpg"), std::cmp::Ordering::Greater);
        assert_eq!(natural_cmp("page01.jpg", "page1.jpg"), std::cmp::Ordering::Equal);
    }

    #[test]
    fn test_list_zip_entries_root_and_subdir() {
        let zip_temp = create_test_zip();
        let path = zip_temp.path();

        // Test root listing: should have "folder1" (is_dir) and "root_image.jpg"
        let root_entries = list_zip_entries(path, "", None).unwrap();
        assert_eq!(root_entries.len(), 2);
        assert_eq!(root_entries[0].name, "folder1");
        assert!(root_entries[0].is_dir);
        assert_eq!(root_entries[1].name, "root_image.jpg");
        assert!(!root_entries[1].is_dir);

        // Test subdir listing: inside "folder1", should have "01.png" and "02.jpg"
        let sub_entries = list_zip_entries(path, "folder1", None).unwrap();
        assert_eq!(sub_entries.len(), 2);
        assert_eq!(sub_entries[0].name, "01.png");
        assert!(!sub_entries[0].is_dir);
        assert_eq!(sub_entries[1].name, "02.jpg");
        assert!(!sub_entries[1].is_dir);
    }

    #[test]
    fn test_read_zip_entry_bytes() {
        let zip_temp = create_test_zip();
        let path = zip_temp.path();

        let (bytes, mime) = read_zip_entry_bytes(path, "folder1/01.png").unwrap();
        assert_eq!(bytes, b"fake png data 1");
        assert_eq!(mime, "image/png");

        let err = read_zip_entry_bytes(path, "nonexistent.png");
        assert!(err.is_err());
    }

    #[test]
    fn test_read_first_image_bytes() {
        let zip_temp = create_test_zip();
        let path = zip_temp.path();

        let (bytes, name, mime) = read_first_image_bytes(path).unwrap();
        assert_eq!(name, "folder1/01.png");
        assert_eq!(bytes, b"fake png data 1");
        assert_eq!(mime, "image/png");
    }

    #[test]
    fn test_specific_user_zip() {
        let p = Path::new(r"H:\r18\同人誌\同人（圧縮）\(ゲームCG集)DISCIPLINE -The record of a Crusade-(HCGのみ).zip");
        if !p.exists() {
            println!("File does not exist");
            return;
        }

        // Test root listing
        let root = list_zip_entries(p, "", None).unwrap();
        println!("ROOT count: {}", root.len());
        for e in &root {
            println!("  Root entry: name='{}', is_dir={}", e.name, e.is_dir);
        }
        assert!(!root.is_empty());
        assert_eq!(root[0].name, "(ゲームCG集)DISCIPLINE -The record of a Crusade-");

        // Test cover image extraction
        let (cover_bytes, cover_name, cover_mime) = read_first_image_bytes(p).unwrap();
        println!("Cover image: name='{}', mime='{}', size={} bytes", cover_name, cover_mime, cover_bytes.len());
        assert!(!cover_bytes.is_empty());

        // Test reading specific image by decoded inner path
        let (img_bytes, mime) = read_zip_entry_bytes(p, &cover_name).unwrap();
        assert_eq!(img_bytes.len(), cover_bytes.len());
        assert_eq!(mime, cover_mime);
    }
}
