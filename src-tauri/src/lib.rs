use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Serialize, Deserialize, Debug)]
pub struct EntryItem {
    name: String,
    path: String,
    is_dir: bool,
    thumbnail_path: Option<String>,
}

fn is_image(path: &Path) -> bool {
    let extensions = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];
    if let Some(ext) = path.extension() {
        if let Some(ext_str) = ext.to_str() {
            return extensions.contains(&ext_str.to_lowercase().as_str());
        }
    }
    false
}

fn find_first_image_in_dir(dir_path: &Path) -> Option<String> {
    if let Ok(entries) = fs::read_dir(dir_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() && is_image(&path) {
                return Some(path.to_string_lossy().to_string());
            }
        }
        // If no image in top level, maybe search one level deeper?
        // For simplicity, we just check top level for now as per requirements.
    }
    None
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DirectoryResult {
    entries: Vec<EntryItem>,
    path: String,
}

#[tauri::command]
fn get_directory_entries(path: String) -> Result<DirectoryResult, String> {
    let p = Path::new(&path);
    let root = if p.is_file() {
        p.parent().ok_or("No parent directory")?
    } else {
        p
    };

    if !root.is_dir() {
        return Err("Not a directory".to_string());
    }

    let mut result = Vec::new();
    if let Ok(entries) = fs::read_dir(root) {
        for entry in entries.flatten() {
            let entry_path = entry.path();
            let is_dir = entry_path.is_dir();
            let name = entry_path
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default();

            if is_dir {
                let thumbnail_path = find_first_image_in_dir(&entry_path);
                result.push(EntryItem {
                    name,
                    path: entry_path.to_string_lossy().to_string(),
                    is_dir: true,
                    thumbnail_path,
                });
            } else if is_image(&entry_path) {
                result.push(EntryItem {
                    name,
                    path: entry_path.to_string_lossy().to_string(),
                    is_dir: false,
                    thumbnail_path: Some(entry_path.to_string_lossy().to_string()),
                });
            }
        }
    }

    // Sort: directories first, then alphabetically
    result.sort_by(|a, b| {
        if a.is_dir != b.is_dir {
            b.is_dir.cmp(&a.is_dir)
        } else {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        }
    });

    Ok(DirectoryResult {
        entries: result,
        path: root.to_string_lossy().to_string(),
    })
}

#[tauri::command]
fn search_folders(root_path: String, query: String) -> Result<Vec<EntryItem>, String> {
    let mut results = Vec::new();
    let root = Path::new(&root_path);
    if !root.is_dir() {
        return Err("Root path is not a directory".to_string());
    }

    let query_lower = query.to_lowercase();
    search_recursive(root, &query_lower, 0, 3, &mut results);

    // Sort results by name
    results.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    Ok(results)
}

fn search_recursive(dir: &Path, query: &String, depth: u32, max_depth: u32, results: &mut Vec<EntryItem>) {
    if depth > max_depth {
        return;
    }

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let name = path.file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();

                if name.to_lowercase().contains(query) {
                    let thumbnail_path = find_first_image_in_dir(&path);
                    results.push(EntryItem {
                        name: name.clone(),
                        path: path.to_string_lossy().to_string(),
                        is_dir: true,
                        thumbnail_path,
                    });
                }
                
                search_recursive(&path, query, depth + 1, max_depth, results);
            }
        }
    }
}

#[tauri::command]
fn rename_entry(old_path: String, new_path: String) -> Result<(), String> {
    fs::rename(old_path, new_path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::new()
            .with_filename("window-state.json")
            .build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![get_directory_entries, search_folders, rename_entry])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
