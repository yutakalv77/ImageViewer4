use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use encoding_rs::SHIFT_JIS;

#[derive(Serialize, Deserialize, Debug)]
pub struct EntryItem {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub thumbnail_path: Option<String>,
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
    }
    None
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DirectoryResult {
    pub entries: Vec<EntryItem>,
    pub path: String,
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

#[cfg(windows)]
struct SearchContext {
    found: bool,
}

#[cfg(windows)]
unsafe extern "system" fn enum_windows_proc(hwnd: windows_sys::Win32::Foundation::HWND, lparam: windows_sys::Win32::Foundation::LPARAM) -> windows_sys::Win32::Foundation::BOOL {
    use windows_sys::Win32::UI::WindowsAndMessaging::GetClassNameW;
    let mut class_name = [0u16; 256];
    let len = GetClassNameW(hwnd, class_name.as_mut_ptr(), class_name.len() as i32);
    if len > 0 {
        let name = String::from_utf16_lossy(&class_name[..len as usize]);
        if name.starts_with("EVERYTHING") {
            let context = &mut *(lparam as *mut SearchContext);
            context.found = true;
            return 0; // Stop enumeration
        }
    }
    1 // Continue enumeration
}

#[tauri::command]
fn check_everything_running() -> bool {
    #[cfg(windows)]
    {
        use windows_sys::Win32::UI::WindowsAndMessaging::{EnumWindows, FindWindowExW, HWND_MESSAGE};
        
        let mut context = SearchContext { found: false };
        
        unsafe {
            EnumWindows(Some(enum_windows_proc), &mut context as *mut _ as isize);
            if context.found {
                return true;
            }

            let classes = ["EVERYTHING_TASKBAR_NOTIFICATION_ID", "EVERYTHING_TASKBAR_NOTIFICATION_ID_1.5", "EVERYTHING"];
            for class in classes {
                let class_name: Vec<u16> = class.encode_utf16().chain(std::iter::once(0)).collect();
                let hwnd_msg = FindWindowExW(HWND_MESSAGE, std::ptr::null_mut(), class_name.as_ptr(), std::ptr::null());
                if hwnd_msg != std::ptr::null_mut() {
                    return true;
                }
            }
        }
        false
    }
    #[cfg(not(windows))]
    {
        false
    }
}

/// Decodes CLI output bytes to a String, attempting Shift-JIS first (common on Japanese Windows)
/// and falling back to UTF-8.
fn decode_cli_output(bytes: &[u8]) -> String {
    let (decoded_text, _encoding, has_errors) = SHIFT_JIS.decode(bytes);
    if has_errors {
        String::from_utf8_lossy(bytes).into_owned()
    } else {
        decoded_text.into_owned()
    }
}

#[tauri::command]
async fn search_everything(query: String, max_results: u32, cli_path: String) -> Result<Vec<EntryItem>, String> {
    #[cfg(windows)]
    {
        if !check_everything_running() {
            return Err("Everything is not running. Please start Everything client first.".to_string());
        }

        let cmd_path = if !cli_path.is_empty() {
            cli_path.clone()
        } else {
            "es.exe".to_string()
        };

        let result = std::process::Command::new(&cmd_path)
            .arg("-n")
            .arg(max_results.to_string())
            .arg(format!("folder:{}", query))
            .output();

        match result {
            Ok(out) => {
                let stdout_text = decode_cli_output(&out.stdout);
                let stderr_text = String::from_utf8_lossy(&out.stderr).to_string();

                if out.status.success() {
                    let mut results = Vec::new();
                    for line in stdout_text.lines() {
                        if results.len() >= max_results as usize { break; }
                        
                        let path_str: &str = line.trim();
                        if path_str.is_empty() { continue; }
                        let path = Path::new(path_str);
                        
                        if path.is_dir() {
                            let name = path.file_name()
                                .map(|n| n.to_string_lossy().to_string())
                                .unwrap_or_else(|| path_str.to_string());
                            let thumbnail_path = find_first_image_in_dir(path);
                            results.push(EntryItem {
                                name,
                                path: path_str.to_string(),
                                is_dir: true,
                                thumbnail_path,
                            });
                        }
                    }
                    Ok(results)
                } else {
                    Err(format!(
                        "Everything CLI error ({}): {}\nCommand: {} -n {} folder:{}", 
                        out.status, stderr_text, cmd_path, max_results, query
                    ))
                }
            },
            Err(e) => {
                if e.kind() == std::io::ErrorKind::NotFound {
                    if cli_path.is_empty() {
                        Err("Everything CLI (es.exe) was not found in system PATH. Please install 'es.exe' or specify its path in settings.".to_string())
                    } else {
                        Err(format!("Specified Everything CLI path not found: {}\nError: {}", cli_path, e))
                    }
                } else {
                    Err(format!("Failed to execute Everything CLI: {}\nCommand: {}", e, cmd_path))
                }
            }
        }
    }
    #[cfg(not(windows))]
    {
        Err("Everything search is only supported on Windows".to_string())
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
        .invoke_handler(tauri::generate_handler![
            get_directory_entries, 
            search_folders, 
            rename_entry,
            search_everything,
            check_everything_running
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
