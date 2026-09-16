use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use tauri::Manager;

use crate::{find_first_image_in_dir, get_path_metadata};

#[cfg(windows)]
use windows_sys::{
    core::{GUID, HRESULT},
    Win32::{
        Foundation::{S_FALSE, S_OK, SIZE},
        Graphics::Gdi::{
            CreateCompatibleDC, DeleteDC, DeleteObject, GetDIBits, GetObjectW, BITMAP, BITMAPINFO,
            BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS, HBITMAP, HDC,
        },
        System::Com::{CoInitializeEx, CoUninitialize, COINIT_APARTMENTTHREADED, COINIT_DISABLE_OLE1DDE},
        UI::Shell::SHCreateItemFromParsingName,
    },
};

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

pub fn get_cached_folder_thumbnail_path(
    cache_dir: &Path,
    folder_path: &Path,
    folder_modified: Option<u64>,
) -> Option<PathBuf> {
    get_cached_thumbnail_path(
        cache_dir,
        folder_path,
        folder_modified,
        None,
        DEFAULT_THUMBNAIL_MAX_SIZE,
    )
}

pub fn get_cached_image_thumbnail_path(
    cache_dir: &Path,
    image_path: &Path,
    modified: Option<u64>,
    file_size: Option<u64>,
) -> Option<PathBuf> {
    get_cached_thumbnail_path(
        cache_dir,
        image_path,
        modified,
        file_size,
        DEFAULT_THUMBNAIL_MAX_SIZE,
    )
}

pub fn save_image_as_thumbnail(img: &image::RgbImage, target_cache_path: &Path) -> Result<PathBuf, String> {
    let parent = target_cache_path.parent().ok_or("Invalid cache path")?;
    if !parent.exists() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let count = TEMP_COUNTER.fetch_add(1, Ordering::Relaxed);
    let tmp_name = format!(
        "tmp_{}_{}_{}.jpg",
        std::process::id(),
        count,
        target_cache_path.file_name().and_then(|n| n.to_str()).unwrap_or("thumb")
    );
    let tmp_path = parent.join(tmp_name);

    img.save_with_format(&tmp_path, image::ImageFormat::Jpeg)
        .map_err(|e| format!("Failed to encode thumbnail: {}", e))?;

    if let Err(e) = fs::rename(&tmp_path, target_cache_path) {
        let _ = fs::remove_file(&tmp_path);
        return Err(format!("Failed to rename thumbnail to target: {}", e));
    }

    Ok(target_cache_path.to_path_buf())
}

pub fn generate_thumbnail(source_path: &Path, target_cache_path: &Path, max_size: u32) -> Result<PathBuf, String> {
    let img = image::open(source_path)
        .map_err(|e| format!("Failed to open image {:?}: {}", source_path, e))?;

    let thumb = img.thumbnail(max_size, max_size);
    let rgb = thumb.to_rgb8();

    save_image_as_thumbnail(&rgb, target_cache_path)
}

#[cfg(windows)]
const IID_ISHELLITEMIMAGEFACTORY: GUID = GUID {
    data1: 0xbcc18b79,
    data2: 0xba16,
    data3: 0x442f,
    data4: [0x80, 0xc4, 0x7a, 0x14, 0x0c, 0x1d, 0x11, 0x4e],
};

#[cfg(windows)]
#[allow(non_snake_case)]
#[repr(C)]
struct IShellItemImageFactoryVtbl {
    pub QueryInterface: unsafe extern "system" fn(
        this: *mut std::ffi::c_void,
        riid: *const GUID,
        ppv: *mut *mut std::ffi::c_void,
    ) -> HRESULT,
    pub AddRef: unsafe extern "system" fn(this: *mut std::ffi::c_void) -> u32,
    pub Release: unsafe extern "system" fn(this: *mut std::ffi::c_void) -> u32,
    pub GetImage: unsafe extern "system" fn(
        this: *mut std::ffi::c_void,
        size: SIZE,
        flags: u32,
        phbm: *mut HBITMAP,
    ) -> HRESULT,
}

#[cfg(windows)]
#[allow(non_snake_case)]
#[repr(C)]
struct IShellItemImageFactory {
    pub lpVtbl: *const IShellItemImageFactoryVtbl,
}

#[cfg(windows)]
struct ComGuard {
    should_uninit: bool,
}

#[cfg(windows)]
impl ComGuard {
    fn new() -> Self {
        unsafe {
            let hr = CoInitializeEx(
                std::ptr::null_mut(),
                (COINIT_APARTMENTTHREADED | COINIT_DISABLE_OLE1DDE) as u32,
            );
            Self {
                should_uninit: hr == S_OK || hr == S_FALSE,
            }
        }
    }
}

#[cfg(windows)]
impl Drop for ComGuard {
    fn drop(&mut self) {
        if self.should_uninit {
            unsafe {
                CoUninitialize();
            }
        }
    }
}

#[cfg(windows)]
struct ComReleaseGuard(*mut IShellItemImageFactory);

#[cfg(windows)]
impl Drop for ComReleaseGuard {
    fn drop(&mut self) {
        if !self.0.is_null() {
            unsafe {
                ((*(*self.0).lpVtbl).Release)(self.0 as *mut std::ffi::c_void);
            }
        }
    }
}

#[cfg(windows)]
struct BitmapGuard(HBITMAP);

#[cfg(windows)]
impl Drop for BitmapGuard {
    fn drop(&mut self) {
        if !self.0.is_null() {
            unsafe {
                DeleteObject(self.0 as _);
            }
        }
    }
}

#[cfg(windows)]
struct DcGuard(HDC);

#[cfg(windows)]
impl Drop for DcGuard {
    fn drop(&mut self) {
        if !self.0.is_null() {
            unsafe {
                DeleteDC(self.0);
            }
        }
    }
}

/// Converts a 32-bit BGRA DIB pixel buffer to an `image::RgbImage`.
/// If the buffer contains alpha transparency, it composites over a white background.
/// If all alpha values are 0 (standard Windows GDI opaque bitmap), alpha is ignored.
pub fn bgra_to_rgb_image(width: u32, height: u32, raw_pixels: &[u8]) -> Result<image::RgbImage, String> {
    let expected_len = (width as usize) * (height as usize) * 4;
    if raw_pixels.len() != expected_len {
        return Err(format!(
            "Pixel buffer length mismatch: expected {}, got {}",
            expected_len,
            raw_pixels.len()
        ));
    }

    let has_alpha = raw_pixels.chunks_exact(4).any(|p| p[3] > 0 && p[3] < 255);
    let mut rgb_pixels = Vec::with_capacity((width as usize) * (height as usize) * 3);

    for chunk in raw_pixels.chunks_exact(4) {
        let b = chunk[0];
        let g = chunk[1];
        let r = chunk[2];
        let a = chunk[3];

        if has_alpha {
            let alpha = a as u32;
            let inv_alpha = 255 - alpha;
            let blended_r = ((r as u32 * alpha + 255 * inv_alpha) / 255) as u8;
            let blended_g = ((g as u32 * alpha + 255 * inv_alpha) / 255) as u8;
            let blended_b = ((b as u32 * alpha + 255 * inv_alpha) / 255) as u8;
            rgb_pixels.push(blended_r);
            rgb_pixels.push(blended_g);
            rgb_pixels.push(blended_b);
        } else {
            rgb_pixels.push(r);
            rgb_pixels.push(g);
            rgb_pixels.push(b);
        }
    }

    image::RgbImage::from_raw(width, height, rgb_pixels)
        .ok_or_else(|| "Failed to construct RgbImage from pixel buffer".to_string())
}

#[cfg(windows)]
pub fn extract_shell_thumbnail(
    source_path: &Path,
    target_cache_path: &Path,
    max_size: u32,
) -> Result<PathBuf, String> {
    use std::os::windows::ffi::OsStrExt;

    let _com_guard = ComGuard::new();

    let path_wide: Vec<u16> = source_path
        .as_os_str()
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    let mut factory_ptr: *mut std::ffi::c_void = std::ptr::null_mut();
    let hr = unsafe {
        SHCreateItemFromParsingName(
            path_wide.as_ptr(),
            std::ptr::null_mut(),
            &IID_ISHELLITEMIMAGEFACTORY,
            &mut factory_ptr,
        )
    };

    if hr != S_OK || factory_ptr.is_null() {
        return Err(format!("SHCreateItemFromParsingName failed with hr=0x{:08x}", hr as u32));
    }

    let factory_guard = ComReleaseGuard(factory_ptr as *mut IShellItemImageFactory);
    let size = SIZE {
        cx: max_size as i32,
        cy: max_size as i32,
    };

    let mut raw_hbitmap: HBITMAP = std::ptr::null_mut();
    // Try SIIGBF_BIGGERSIZEOK | SIIGBF_THUMBNAILONLY (0x1 | 0x8 = 0x9) first
    let mut hr_get = unsafe {
        ((*(*factory_guard.0).lpVtbl).GetImage)(factory_ptr, size, 0x9, &mut raw_hbitmap)
    };

    // If thumbnail-only flag failed, try SIIGBF_BIGGERSIZEOK (0x1)
    if hr_get != S_OK || raw_hbitmap.is_null() {
        hr_get = unsafe {
            ((*(*factory_guard.0).lpVtbl).GetImage)(factory_ptr, size, 0x1, &mut raw_hbitmap)
        };
    }

    if hr_get != S_OK || raw_hbitmap.is_null() {
        return Err(format!("IShellItemImageFactory::GetImage failed with hr=0x{:08x}", hr_get as u32));
    }

    let bitmap_guard = BitmapGuard(raw_hbitmap);

    // Inspect bitmap geometry
    let mut bm: BITMAP = unsafe { std::mem::zeroed() };
    let get_obj_res = unsafe {
        GetObjectW(
            bitmap_guard.0 as _,
            std::mem::size_of::<BITMAP>() as i32,
            &mut bm as *mut _ as *mut std::ffi::c_void,
        )
    };

    if get_obj_res == 0 || bm.bmWidth <= 0 || bm.bmHeight <= 0 {
        return Err("GetObjectW failed or invalid bitmap dimensions".to_string());
    }

    let width = bm.bmWidth as u32;
    let height = bm.bmHeight as u32;

    // Filter out fallback icons (e.g. 16x16 or 32x32 generic file icons when large thumbnail requested)
    if width < 48 && height < 48 && max_size >= 64 {
        return Err("Returned image is an icon rather than a thumbnail".to_string());
    }

    let raw_hdc = unsafe { CreateCompatibleDC(std::ptr::null_mut()) };
    if raw_hdc.is_null() {
        return Err("CreateCompatibleDC failed".to_string());
    }
    let dc_guard = DcGuard(raw_hdc);

    let mut bmi: BITMAPINFO = unsafe { std::mem::zeroed() };
    bmi.bmiHeader.biSize = std::mem::size_of::<BITMAPINFOHEADER>() as u32;
    bmi.bmiHeader.biWidth = width as i32;
    bmi.bmiHeader.biHeight = -(height as i32); // Negative for top-down DIB
    bmi.bmiHeader.biPlanes = 1;
    bmi.bmiHeader.biBitCount = 32;
    bmi.bmiHeader.biCompression = BI_RGB;

    let mut raw_pixels = vec![0u8; (width * height * 4) as usize];
    let lines = unsafe {
        GetDIBits(
            dc_guard.0,
            bitmap_guard.0 as _,
            0,
            height,
            raw_pixels.as_mut_ptr() as *mut std::ffi::c_void,
            &mut bmi,
            DIB_RGB_COLORS,
        )
    };

    if lines == 0 {
        return Err("GetDIBits failed".to_string());
    }

    let rgb_img = bgra_to_rgb_image(width, height, &raw_pixels)?;
    save_image_as_thumbnail(&rgb_img, target_cache_path)
}

#[cfg(not(windows))]
pub fn extract_shell_thumbnail(
    _source_path: &Path,
    _target_cache_path: &Path,
    _max_size: u32,
) -> Result<PathBuf, String> {
    Err("Shell thumbnail extraction is only supported on Windows".to_string())
}

pub fn create_folder_thumbnail(
    folder_path: &Path,
    target_cache_path: &Path,
    size: u32,
) -> Result<PathBuf, String> {
    let first_image_str = find_first_image_in_dir(folder_path)
        .ok_or_else(|| "No image found in directory".to_string())?;
    let first_image_path = Path::new(&first_image_str);

    let ext = first_image_path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .unwrap_or_default();

    if ext == "svg" {
        return Ok(first_image_path.to_path_buf());
    }

    #[cfg(windows)]
    {
        if let Ok(thumb_path) = extract_shell_thumbnail(first_image_path, target_cache_path, size) {
            return Ok(thumb_path);
        }
    }

    match generate_thumbnail(first_image_path, target_cache_path, size) {
        Ok(thumb_path) => Ok(thumb_path),
        Err(err) => {
            eprintln!("Thumbnail generation failed for {:?}: {}. Falling back to original.", first_image_path, err);
            Ok(first_image_path.to_path_buf())
        }
    }
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

    let cache_dir = get_thumbnail_cache_dir(app)?;

    if p.is_dir() {
        let (_, folder_modified, _) = get_path_metadata(p);
        if let Some(cached) = get_cached_thumbnail_path(&cache_dir, p, folder_modified, None, size) {
            return Ok(cached.to_string_lossy().to_string());
        }

        let filename = compute_thumbnail_filename(p, folder_modified, None, size);
        let target = cache_dir.join(filename);

        create_folder_thumbnail(p, &target, size).map(|p| p.to_string_lossy().to_string())
    } else {
        let ext = p
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| e.to_lowercase())
            .unwrap_or_default();

        if ext == "svg" {
            return Ok(p.to_string_lossy().to_string());
        }

        let (file_size, modified, _) = get_path_metadata(p);

        if let Some(cached) = get_cached_thumbnail_path(&cache_dir, p, modified, file_size, size) {
            return Ok(cached.to_string_lossy().to_string());
        }

        let filename = compute_thumbnail_filename(p, modified, file_size, size);
        let target = cache_dir.join(filename);

        #[cfg(windows)]
        {
            if let Ok(thumb_path) = extract_shell_thumbnail(p, &target, size) {
                return Ok(thumb_path.to_string_lossy().to_string());
            }
        }

        match generate_thumbnail(p, &target, size) {
            Ok(thumb_path) => Ok(thumb_path.to_string_lossy().to_string()),
            Err(err) => {
                eprintln!("Thumbnail generation failed for {:?}: {}. Falling back to original.", p, err);
                Ok(p.to_string_lossy().to_string())
            }
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
    fn test_get_cached_folder_and_image_thumbnail_path() {
        let temp_dir = std::env::temp_dir().join("iv_test_folder_image_cache");
        let _ = fs::create_dir_all(&temp_dir);

        let folder_path = Path::new("C:/photos/my_album");
        let image_path = Path::new("C:/photos/my_album/pic.jpg");

        // Folder cache
        let folder_filename = compute_thumbnail_filename(folder_path, Some(100), None, DEFAULT_THUMBNAIL_MAX_SIZE);
        let folder_cache_file = temp_dir.join(&folder_filename);

        // Image cache
        let image_filename = compute_thumbnail_filename(image_path, Some(100), Some(500), DEFAULT_THUMBNAIL_MAX_SIZE);
        let image_cache_file = temp_dir.join(&image_filename);

        assert!(get_cached_folder_thumbnail_path(&temp_dir, folder_path, Some(100)).is_none());
        assert!(get_cached_image_thumbnail_path(&temp_dir, image_path, Some(100), Some(500)).is_none());

        fs::write(&folder_cache_file, b"folder").unwrap();
        fs::write(&image_cache_file, b"image").unwrap();

        assert_eq!(
            get_cached_folder_thumbnail_path(&temp_dir, folder_path, Some(100)),
            Some(folder_cache_file.clone())
        );
        assert_eq!(
            get_cached_image_thumbnail_path(&temp_dir, image_path, Some(100), Some(500)),
            Some(image_cache_file.clone())
        );

        let _ = fs::remove_file(&folder_cache_file);
        let _ = fs::remove_file(&image_cache_file);
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

    #[test]
    fn test_save_image_as_thumbnail() {
        let temp_dir = std::env::temp_dir().join("iv_test_save_thumb");
        let _ = fs::create_dir_all(&temp_dir);

        let out_path = temp_dir.join("saved_thumb.jpg");
        let img = image::RgbImage::new(50, 50);

        let res = save_image_as_thumbnail(&img, &out_path);
        assert!(res.is_ok());
        assert!(out_path.exists());
        assert!(fs::metadata(&out_path).unwrap().len() > 0);

        let _ = fs::remove_file(&out_path);
        let _ = fs::remove_dir(&temp_dir);
    }

    #[test]
    #[cfg(windows)]
    fn test_extract_shell_thumbnail_or_fallback() {
        let temp_dir = std::env::temp_dir().join("iv_test_shell_thumb");
        let _ = fs::create_dir_all(&temp_dir);

        let sample_img_path = temp_dir.join("sample.jpg");
        let sample_thumb_path = temp_dir.join("sample_thumb.jpg");

        let test_img = image::RgbImage::new(100, 100);
        test_img.save(&sample_img_path).unwrap();

        // Even if shell thumbnail extraction fails or succeeds, it must not panic
        let result = extract_shell_thumbnail(&sample_img_path, &sample_thumb_path, 64);
        if let Ok(path) = result {
            assert!(path.exists());
            assert!(fs::metadata(&path).unwrap().len() > 0);
            let _ = fs::remove_file(&sample_thumb_path);
        }

        // Invalid path must return Err
        let invalid_path = temp_dir.join("non_existent.jpg");
        let invalid_out = temp_dir.join("non_existent_thumb.jpg");
        assert!(extract_shell_thumbnail(&invalid_path, &invalid_out, 64).is_err());

        let _ = fs::remove_file(&sample_img_path);
        let _ = fs::remove_dir(&temp_dir);
    }

    #[test]
    fn test_bgra_to_rgb_image_opaque() {
        // 2x1 image, all alpha = 0 (opaque in GDI convention)
        // Pixel 0: B=10, G=20, R=30, A=0 -> RGB: [30, 20, 10]
        // Pixel 1: B=100, G=150, R=200, A=0 -> RGB: [200, 150, 100]
        let raw = vec![10, 20, 30, 0, 100, 150, 200, 0];
        let img = bgra_to_rgb_image(2, 1, &raw).unwrap();
        assert_eq!(img.width(), 2);
        assert_eq!(img.height(), 1);

        let p0 = img.get_pixel(0, 0);
        assert_eq!(p0.0, [30, 20, 10]);

        let p1 = img.get_pixel(1, 0);
        assert_eq!(p1.0, [200, 150, 100]);
    }

    #[test]
    fn test_bgra_to_rgb_image_blended_alpha() {
        // 2x1 image with alpha channel
        // Pixel 0: B=0, G=0, R=0, A=128 (50% black over white background) -> ~[127, 127, 127]
        // Pixel 1: B=0, G=0, R=0, A=0 (100% transparent over white background) -> [255, 255, 255]
        let raw = vec![0, 0, 0, 128, 0, 0, 0, 0];
        let img = bgra_to_rgb_image(2, 1, &raw).unwrap();

        let p0 = img.get_pixel(0, 0);
        assert!((p0.0[0] as i32 - 127).abs() <= 1);
        assert!((p0.0[1] as i32 - 127).abs() <= 1);
        assert!((p0.0[2] as i32 - 127).abs() <= 1);

        let p1 = img.get_pixel(1, 0);
        assert_eq!(p1.0, [255, 255, 255]);
    }

    #[test]
    fn test_bgra_to_rgb_image_mismatched_length() {
        let raw = vec![0, 1, 2]; // Needs 8 for 2x1
        assert!(bgra_to_rgb_image(2, 1, &raw).is_err());
    }

    #[test]
    fn test_create_folder_thumbnail_success_and_empty() {
        let temp_dir = std::env::temp_dir().join("iv_test_folder_thumb");
        let _ = fs::create_dir_all(&temp_dir);

        let sub_folder = temp_dir.join("album");
        let _ = fs::create_dir_all(&sub_folder);

        let empty_folder = temp_dir.join("empty");
        let _ = fs::create_dir_all(&empty_folder);

        // Put an image in album
        let sample_img_path = sub_folder.join("cover.png");
        let test_img = image::RgbImage::new(40, 40);
        test_img.save(&sample_img_path).unwrap();

        let out_path = temp_dir.join("album_thumb.jpg");
        let result = create_folder_thumbnail(&sub_folder, &out_path, 64);
        assert!(result.is_ok());
        let thumb_path = result.unwrap();
        assert!(thumb_path.exists());

        // Empty folder should fail with error
        let empty_out = temp_dir.join("empty_thumb.jpg");
        let empty_result = create_folder_thumbnail(&empty_folder, &empty_out, 64);
        assert!(empty_result.is_err());

        // Cleanup
        let _ = fs::remove_file(&out_path);
        let _ = fs::remove_file(&sample_img_path);
        let _ = fs::remove_dir(&sub_folder);
        let _ = fs::remove_dir(&empty_folder);
        let _ = fs::remove_dir(&temp_dir);
    }
}
