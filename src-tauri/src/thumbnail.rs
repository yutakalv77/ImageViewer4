use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use tauri::Manager;

use crate::{find_first_image_in_dir, get_path_metadata};

pub const DEFAULT_THUMBNAIL_MAX_SIZE: u32 = 384;
static TEMP_COUNTER: AtomicU64 = AtomicU64::new(0);

/// FNV-1a 128-bit hash for deterministic, persistent cache filenames
pub fn fnv1a_hash_128(data: &str) -> u128 {
    let mut hash: u128 = 0x6c62272e07bb014262b821756295c58d;
    for byte in data.bytes() {
        hash ^= byte as u128;
        hash = hash.wrapping_mul(0x000000000100000000000000000001b3);
    }
    hash
}

pub fn get_thumbnail_cache_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let cache_dir = app
        .path()
        .app_cache_dir()
        .map_err(|e| e.to_string())?
        .join("thumbnails");
    if !cache_dir.exists() {
        fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;
    }
    Ok(cache_dir)
}

pub fn compute_thumbnail_filename(path: &Path, modified: Option<u64>, size: Option<u64>, max_size: u32) -> String {
    let key = format!(
        "{}:{}:{}:{}",
        path.to_string_lossy(),
        modified.unwrap_or(0),
        size.unwrap_or(0),
        max_size
    );
    format!("{:032x}.jpg", fnv1a_hash_128(&key))
}

pub fn get_cached_thumbnail_path(
    cache_dir: &Path,
    path: &Path,
    modified: Option<u64>,
    size: Option<u64>,
    max_size: u32,
) -> Option<PathBuf> {
    let filename = compute_thumbnail_filename(path, modified, size, max_size);
    let target = cache_dir.join(filename);
    if target.exists() {
        Some(target)
    } else {
        None
    }
}

pub fn generate_thumbnail(source_path: &Path, target_cache_path: &Path, max_size: u32) -> Result<PathBuf, String> {
    let parent = target_cache_path.parent().ok_or("Invalid cache path")?;
    if !parent.exists() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let img = image::open(source_path)
        .map_err(|e| format!("Failed to open image {:?}: {}", source_path, e))?;

    let thumb = img.thumbnail(max_size, max_size);
    let rgb = thumb.to_rgb8();

    let count = TEMP_COUNTER.fetch_add(1, Ordering::Relaxed);
    let tmp_name = format!(
        "tmp_{}_{}_{}.jpg",
        std::process::id(),
        count,
        target_cache_path.file_name().and_then(|n| n.to_str()).unwrap_or("thumb")
    );
    let tmp_path = parent.join(tmp_name);

    rgb.save_with_format(&tmp_path, image::ImageFormat::Jpeg)
        .map_err(|e| format!("Failed to encode thumbnail: {}", e))?;

    if let Err(e) = fs::rename(&tmp_path, target_cache_path) {
        let _ = fs::remove_file(&tmp_path);
        return Err(format!("Failed to rename thumbnail to target: {}", e));
    }

    Ok(target_cache_path.to_path_buf())
}

pub fn get_or_create_thumbnail(
    app: &tauri::AppHandle,
    path_str: &str,
    max_size: Option<u32>,
) -> Result<String, String> {
    let size = max_size.unwrap_or(DEFAULT_THUMBNAIL_MAX_SIZE);
    let p = Path::new(path_str);
    if !p.exists() {
        return Err(format!("File or directory does not exist: {}", path_str));
    }

    let target_image_path = if p.is_dir() {
        match find_first_image_in_dir(p) {
            Some(first) => PathBuf::from(first),
            None => return Err("No image found in directory".to_string()),
        }
    } else {
        p.to_path_buf()
    };

    if !target_image_path.exists() {
        return Err("Target image does not exist".to_string());
    }

    let ext = target_image_path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .unwrap_or_default();

    if ext == "svg" {
        return Ok(target_image_path.to_string_lossy().to_string());
    }

    let cache_dir = get_thumbnail_cache_dir(app)?;
    let (file_size, modified, _) = get_path_metadata(&target_image_path);

    if let Some(cached) = get_cached_thumbnail_path(&cache_dir, &target_image_path, modified, file_size, size) {
        return Ok(cached.to_string_lossy().to_string());
    }

    let filename = compute_thumbnail_filename(&target_image_path, modified, file_size, size);
    let target = cache_dir.join(filename);

    match generate_thumbnail(&target_image_path, &target, size) {
        Ok(thumb_path) => Ok(thumb_path.to_string_lossy().to_string()),
        Err(err) => {
            eprintln!("Thumbnail generation failed for {:?}: {}. Falling back to original.", target_image_path, err);
            Ok(target_image_path.to_string_lossy().to_string())
        }
    }
}

pub fn calculate_dir_size(dir: &Path) -> u64 {
    let mut total_bytes: u64 = 0;
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            if let Ok(meta) = entry.metadata() {
                if meta.is_file() {
                    total_bytes += meta.len();
                }
            }
        }
    }
    total_bytes
}

pub fn clear_dir_files(dir: &Path) -> u64 {
    let mut count = 0;
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if fs::remove_file(path).is_ok() {
                    count += 1;
                }
            }
        }
    }
    count
}

pub fn clear_thumbnail_cache(app: &tauri::AppHandle) -> Result<u64, String> {
    let cache_dir = get_thumbnail_cache_dir(app)?;
    Ok(clear_dir_files(&cache_dir))
}

pub fn get_thumbnail_cache_size(app: &tauri::AppHandle) -> Result<u64, String> {
    let cache_dir = get_thumbnail_cache_dir(app)?;
    Ok(calculate_dir_size(&cache_dir))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fnv1a_hash_determinism() {
        let h1 = fnv1a_hash_128("C:/photos/cat.jpg:12345:67890:384");
        let h2 = fnv1a_hash_128("C:/photos/cat.jpg:12345:67890:384");
        let h3 = fnv1a_hash_128("C:/photos/dog.jpg:12345:67890:384");

        assert_eq!(h1, h2);
        assert_ne!(h1, h3);
    }

    #[test]
    fn test_compute_thumbnail_filename() {
        let p1 = Path::new("C:/photos/cat.jpg");
        let f1 = compute_thumbnail_filename(p1, Some(1000), Some(5000), 384);
        let f2 = compute_thumbnail_filename(p1, Some(1000), Some(5000), 384);
        let f3_diff_mtime = compute_thumbnail_filename(p1, Some(2000), Some(5000), 384);
        let f4_diff_size = compute_thumbnail_filename(p1, Some(1000), Some(6000), 384);

        assert_eq!(f1, f2);
        assert!(f1.ends_with(".jpg"));
        assert_eq!(f1.len(), 36); // 32 hex chars + ".jpg"
        assert_ne!(f1, f3_diff_mtime);
        assert_ne!(f1, f4_diff_size);
    }

    #[test]
    fn test_get_cached_thumbnail_path() {
        let temp_dir = std::env::temp_dir().join("iv_test_thumb_cache");
        let _ = fs::create_dir_all(&temp_dir);

        let p = Path::new("C:/photos/sample.jpg");
        let filename = compute_thumbnail_filename(p, Some(123), Some(456), 384);
        let cache_file = temp_dir.join(&filename);

        // Before creation
        assert!(get_cached_thumbnail_path(&temp_dir, p, Some(123), Some(456), 384).is_none());

        // Create empty file
        fs::write(&cache_file, b"test").unwrap();
        assert_eq!(
            get_cached_thumbnail_path(&temp_dir, p, Some(123), Some(456), 384),
            Some(cache_file.clone())
        );

        // Cleanup
        let _ = fs::remove_file(&cache_file);
        let _ = fs::remove_dir(&temp_dir);
    }

    #[test]
    fn test_calculate_dir_size_and_clear_dir_files() {
        let temp_dir = std::env::temp_dir().join("iv_test_calc_clear_cache");
        let _ = fs::create_dir_all(&temp_dir);

        // Empty directory
        assert_eq!(calculate_dir_size(&temp_dir), 0);
        assert_eq!(clear_dir_files(&temp_dir), 0);

        // Write 2 test files
        let f1 = temp_dir.join("file1.jpg");
        let f2 = temp_dir.join("file2.jpg");
        fs::write(&f1, b"hello").unwrap(); // 5 bytes
        fs::write(&f2, b"world!").unwrap(); // 6 bytes

        assert_eq!(calculate_dir_size(&temp_dir), 11);

        // Clear files
        let removed = clear_dir_files(&temp_dir);
        assert_eq!(removed, 2);
        assert_eq!(calculate_dir_size(&temp_dir), 0);

        // Cleanup
        let _ = fs::remove_dir(&temp_dir);
    }
}
