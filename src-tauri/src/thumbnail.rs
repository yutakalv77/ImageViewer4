use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use tauri::Manager;
use tokio::sync::Semaphore;

use fast_image_resize as fr;

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

pub fn get_cached_zip_thumbnail_path(
    cache_dir: &Path,
    zip_path: &Path,
    inner_path: &str,
) -> Option<PathBuf> {
    let virtual_path_str = crate::zip_handler::make_zip_path(zip_path, inner_path);
    let virtual_p = Path::new(&virtual_path_str);
    let (file_size, modified, _) = get_path_metadata(zip_path);
    get_cached_thumbnail_path(
        cache_dir,
        virtual_p,
        modified,
        file_size,
        DEFAULT_THUMBNAIL_MAX_SIZE,
    )
}

pub fn calculate_thumbnail_dimensions(src_w: u32, src_h: u32, max_size: u32) -> (u32, u32) {
    if src_w == 0 || src_h == 0 || max_size == 0 {
        return (0, 0);
    }
    if src_w <= max_size && src_h <= max_size {
        return (src_w, src_h);
    }
    if src_w > src_h {
        let h = ((src_h as u64 * max_size as u64 + src_w as u64 / 2) / src_w as u64) as u32;
        (max_size, h.max(1))
    } else {
        let w = ((src_w as u64 * max_size as u64 + src_h as u64 / 2) / src_h as u64) as u32;
        (w.max(1), max_size)
    }
}

pub fn save_raw_thumbnail(bytes: &[u8], target_cache_path: &Path) -> Result<PathBuf, String> {
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

    fs::write(&tmp_path, bytes).map_err(|e| format!("Failed to write raw thumbnail: {}", e))?;

    if let Err(e) = fs::rename(&tmp_path, target_cache_path) {
        let _ = fs::remove_file(&tmp_path);
        if target_cache_path.exists() {
            return Ok(target_cache_path.to_path_buf());
        }
        return Err(format!("Failed to rename raw thumbnail to target: {}", e));
    }

    Ok(target_cache_path.to_path_buf())
}

pub fn save_image_as_thumbnail(img: &image::RgbImage, target_cache_path: &Path) -> Result<PathBuf, String> {
    use std::io::{BufWriter, Write};

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

    {
        let file = fs::File::create(&tmp_path).map_err(|e| format!("Failed to create tmp file: {}", e))?;
        let mut writer = BufWriter::with_capacity(64 * 1024, file);
        let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut writer, 80);
        encoder
            .encode(img.as_raw(), img.width(), img.height(), image::ColorType::Rgb8)
            .map_err(|e| format!("Failed to encode thumbnail: {}", e))?;
        writer.flush().map_err(|e| format!("Failed to flush thumbnail file: {}", e))?;
    }

    if let Err(e) = fs::rename(&tmp_path, target_cache_path) {
        let _ = fs::remove_file(&tmp_path);
        if target_cache_path.exists() {
            return Ok(target_cache_path.to_path_buf());
        }
        return Err(format!("Failed to rename thumbnail to target: {}", e));
    }

    Ok(target_cache_path.to_path_buf())
}

pub fn generate_thumbnail_from_bytes(
    bytes: &[u8],
    target_cache_path: &Path,
    max_size: u32,
) -> Result<PathBuf, String> {
    let img = image::load_from_memory(bytes)
        .map_err(|e| format!("Failed to decode image from memory: {}", e))?;
    let rgb = dynamic_image_to_rgb(&img);
    let resized = resize_image_fast(&rgb, max_size)?;
    save_image_as_thumbnail(&resized, target_cache_path)
}

pub fn resize_image_fast(
    src_rgb: &image::RgbImage,
    max_size: u32,
) -> Result<image::RgbImage, String> {
    let (src_w, src_h) = (src_rgb.width(), src_rgb.height());
    let (dst_w, dst_h) = calculate_thumbnail_dimensions(src_w, src_h, max_size);

    if dst_w == 0 || dst_h == 0 {
        return Err("Zero dimension for resized thumbnail".to_string());
    }

    if src_w == dst_w && src_h == dst_h {
        return Ok(src_rgb.clone());
    }

    let src_ref = fr::images::ImageRef::new(src_w, src_h, src_rgb.as_raw(), fr::PixelType::U8x3)
        .map_err(|e| format!("Failed to wrap source image for fast resize: {:?}", e))?;
    let mut dst_image = fr::images::Image::new(dst_w, dst_h, fr::PixelType::U8x3);
    let mut resizer = fr::Resizer::new();

    resizer
        .resize(&src_ref, &mut dst_image, None)
        .map_err(|e| format!("Fast image resize failed: {:?}", e))?;

    image::RgbImage::from_raw(dst_w, dst_h, dst_image.into_vec())
        .ok_or_else(|| "Failed to construct RgbImage from resized buffer".to_string())
}

/// Blends a single RGBA pixel over a pure white background (255, 255, 255).
#[inline]
pub fn blend_rgba_to_rgb(r: u8, g: u8, b: u8, a: u8) -> (u8, u8, u8) {
    if a == 255 {
        (r, g, b)
    } else if a == 0 {
        (255, 255, 255)
    } else {
        let alpha = a as u32;
        let inv_alpha = 255 - alpha;
        let blended_r = ((r as u32 * alpha + 255 * inv_alpha) / 255) as u8;
        let blended_g = ((g as u32 * alpha + 255 * inv_alpha) / 255) as u8;
        let blended_b = ((b as u32 * alpha + 255 * inv_alpha) / 255) as u8;
        (blended_r, blended_g, blended_b)
    }
}

/// Composites an RGBA byte slice over a pure white background and returns an RgbImage.
pub fn rgba_to_rgb_with_white_bg(width: u32, height: u32, raw_rgba: &[u8]) -> Result<image::RgbImage, String> {
    let expected_len = (width as usize) * (height as usize) * 4;
    if raw_rgba.len() < expected_len {
        return Err("RGBA buffer length mismatch".to_string());
    }

    let mut rgb_pixels = Vec::with_capacity((width as usize) * (height as usize) * 3);
    for chunk in raw_rgba[..expected_len].chunks_exact(4) {
        let (r, g, b) = blend_rgba_to_rgb(chunk[0], chunk[1], chunk[2], chunk[3]);
        rgb_pixels.push(r);
        rgb_pixels.push(g);
        rgb_pixels.push(b);
    }

    image::RgbImage::from_raw(width, height, rgb_pixels)
        .ok_or_else(|| "Failed to construct RgbImage from blended RGBA buffer".to_string())
}

/// Resizes an RGBA image buffer using SIMD acceleration, then composites the resized image
/// over a white background. This avoids blending millions of input pixels upfront.
pub fn resize_rgba_to_rgb_fast(
    src_w: u32,
    src_h: u32,
    src_rgba: &[u8],
    max_size: u32,
) -> Result<image::RgbImage, String> {
    let (dst_w, dst_h) = calculate_thumbnail_dimensions(src_w, src_h, max_size);

    if dst_w == 0 || dst_h == 0 {
        return Err("Zero dimension for resized thumbnail".to_string());
    }

    let expected_len = (src_w as usize) * (src_h as usize) * 4;
    if src_rgba.len() < expected_len {
        return Err("RGBA source buffer too small".to_string());
    }

    let src_ref = fr::images::ImageRef::new(src_w, src_h, &src_rgba[..expected_len], fr::PixelType::U8x4)
        .map_err(|e| format!("Failed to wrap RGBA source image: {:?}", e))?;
    let mut dst_image = fr::images::Image::new(dst_w, dst_h, fr::PixelType::U8x4);
    let mut resizer = fr::Resizer::new();

    resizer
        .resize(&src_ref, &mut dst_image, None)
        .map_err(|e| format!("Fast RGBA resize failed: {:?}", e))?;

    rgba_to_rgb_with_white_bg(dst_w, dst_h, dst_image.buffer())
}

/// Converts a `DynamicImage` to `RgbImage`. If the image has an alpha channel,
/// it composites the pixels over a pure white background instead of rendering transparent areas black.
#[allow(dead_code)]
pub fn dynamic_image_to_rgb(img: &image::DynamicImage) -> image::RgbImage {
    if img.color().has_alpha() {
        let rgba = img.to_rgba8();
        let (w, h) = rgba.dimensions();
        rgba_to_rgb_with_white_bg(w, h, rgba.as_raw()).unwrap_or_else(|_| img.to_rgb8())
    } else {
        img.to_rgb8()
    }
}

fn parse_tiff_thumbnail(tiff: &[u8]) -> Option<&[u8]> {
    if tiff.len() < 8 {
        return None;
    }

    let is_le = match &tiff[0..2] {
        b"II" => true,
        b"MM" => false,
        _ => return None,
    };

    let read_u16 = |buf: &[u8], offset: usize| -> Option<u16> {
        let b = buf.get(offset..offset + 2)?;
        Some(if is_le {
            u16::from_le_bytes([b[0], b[1]])
        } else {
            u16::from_be_bytes([b[0], b[1]])
        })
    };

    let read_u32 = |buf: &[u8], offset: usize| -> Option<u32> {
        let b = buf.get(offset..offset + 4)?;
        Some(if is_le {
            u32::from_le_bytes([b[0], b[1], b[2], b[3]])
        } else {
            u32::from_be_bytes([b[0], b[1], b[2], b[3]])
        })
    };

    // Verify TIFF marker 42
    if read_u16(tiff, 2)? != 42 {
        return None;
    }

    // Offset to IFD0
    let ifd0_offset = read_u32(tiff, 4)? as usize;
    if ifd0_offset >= tiff.len() {
        return None;
    }

    let ifd0_entries = read_u16(tiff, ifd0_offset)? as usize;

    // Check IFD0 Orientation (tag 0x0112). If orientation is rotated (> 1),
    // skip direct extraction so full pipeline can properly rotate the image.
    for i in 0..ifd0_entries {
        let entry_pos = ifd0_offset.checked_add(2)?.checked_add(i.checked_mul(12)?)?;
        if read_u16(tiff, entry_pos) == Some(0x0112) {
            let orientation = read_u16(tiff, entry_pos.checked_add(8)?)?;
            if orientation > 1 {
                return None;
            }
            break;
        }
    }

    let ifd0_next_offset_pos = ifd0_offset
        .checked_add(2)?
        .checked_add(ifd0_entries.checked_mul(12)?)?;
    let ifd1_offset = read_u32(tiff, ifd0_next_offset_pos)? as usize;

    if ifd1_offset == 0 || ifd1_offset >= tiff.len() {
        return None;
    }

    // IFD1 contains thumbnail metadata
    let ifd1_entries = read_u16(tiff, ifd1_offset)? as usize;
    let mut thumb_offset: Option<usize> = None;
    let mut thumb_len: Option<usize> = None;

    for i in 0..ifd1_entries {
        let entry_pos = ifd1_offset.checked_add(2)?.checked_add(i.checked_mul(12)?)?;
        let tag = read_u16(tiff, entry_pos)?;
        let val_offset = entry_pos.checked_add(8)?;

        match tag {
            0x0201 => {
                // JPEGInterchangeFormat (offset from TIFF header start)
                thumb_offset = Some(read_u32(tiff, val_offset)? as usize);
            }
            0x0202 => {
                // JPEGInterchangeFormatLength (byte count)
                thumb_len = Some(read_u32(tiff, val_offset)? as usize);
            }
            _ => {}
        }
    }

    if let (Some(offset), Some(len)) = (thumb_offset, thumb_len) {
        if offset.checked_add(len)? <= tiff.len() && len > 4 {
            let thumb_data = &tiff[offset..offset + len];
            // Verify thumbnail begins with JPEG SOI (0xFF, 0xD8)
            if thumb_data[0] == 0xFF && thumb_data[1] == 0xD8 {
                return Some(thumb_data);
            }
        }
    }

    None
}

/// Extracts standalone JPEG thumbnail bytes from JPEG file header data.
pub fn extract_exif_thumbnail_from_bytes(data: &[u8]) -> Option<&[u8]> {
    if data.len() < 4 || data[0] != 0xFF || data[1] != 0xD8 {
        return None;
    }

    let mut pos = 2;
    while pos + 4 <= data.len() {
        if data[pos] != 0xFF {
            pos += 1;
            continue;
        }

        let marker = data[pos + 1];
        if marker == 0x00 || marker == 0xFF {
            pos += 1;
            continue;
        }

        if marker == 0xDA || marker == 0xD9 {
            break;
        }

        let seg_len = u16::from_be_bytes([data[pos + 2], data[pos + 3]]) as usize;
        if seg_len < 2 {
            break;
        }

        let seg_end = pos + 2 + seg_len;
        if seg_end > data.len() {
            break;
        }

        if marker == 0xE1 {
            let app1_data = &data[pos + 4..seg_end];
            if app1_data.len() >= 14 && &app1_data[..6] == b"Exif\0\0" {
                let tiff_bytes = &app1_data[6..];
                if let Some(thumb) = parse_tiff_thumbnail(tiff_bytes) {
                    return Some(thumb);
                }
            }
        }

        pos = seg_end;
    }

    None
}

/// Fast-path extraction of embedded EXIF JPEG thumbnail directly from file.
pub fn try_extract_exif_thumbnail(source_path: &Path, target_cache_path: &Path) -> Option<PathBuf> {
    use std::io::Read;
    let mut file = fs::File::open(source_path).ok()?;
    // Read up to 256KB to cover standard Exif APP1 segment
    let mut buffer = vec![0u8; 256 * 1024];
    let n = file.read(&mut buffer).ok()?;
    buffer.truncate(n);

    let thumb_bytes = extract_exif_thumbnail_from_bytes(&buffer)?;
    save_raw_thumbnail(thumb_bytes, target_cache_path).ok()
}

/// Decodes WebP bytes to an RgbImage using Google's native SIMD-accelerated libwebp.
/// If the WebP image has an alpha channel, it blends over a white background.
#[allow(dead_code)]
pub fn decode_webp_to_rgb(data: &[u8]) -> Result<image::RgbImage, String> {
    let decoder = webp::Decoder::new(data);
    let webp_image = decoder
        .decode()
        .ok_or_else(|| "Failed to decode WebP image via libwebp".to_string())?;

    let width = webp_image.width();
    let height = webp_image.height();
    let raw = &*webp_image;

    if width == 0 || height == 0 {
        return Err("WebP image has zero dimensions".to_string());
    }

    if webp_image.is_alpha() {
        rgba_to_rgb_with_white_bg(width, height, raw)
    } else {
        let expected_len = (width as usize) * (height as usize) * 3;
        if raw.len() < expected_len {
            return Err("WebP RGB buffer length mismatch".to_string());
        }

        image::RgbImage::from_raw(width, height, raw[..expected_len].to_vec())
            .ok_or_else(|| "Failed to construct RgbImage from WebP RGB buffer".to_string())
    }
}

/// Generates a thumbnail for a WebP file using native SIMD libwebp decoding and fast_image_resize.
/// Uses zero-copy source wrapping and defers alpha blending until after downsizing for maximum performance.
pub fn generate_webp_thumbnail_fast(
    source_path: &Path,
    target_cache_path: &Path,
    max_size: u32,
) -> Result<PathBuf, String> {
    let bytes = fs::read(source_path).map_err(|e| format!("Failed to read WebP file: {}", e))?;
    let decoder = webp::Decoder::new(&bytes);
    let webp_image = decoder
        .decode()
        .ok_or_else(|| "Failed to decode WebP image via libwebp".to_string())?;

    let width = webp_image.width();
    let height = webp_image.height();
    if width == 0 || height == 0 {
        return Err("WebP image has zero dimensions".to_string());
    }

    let raw = &*webp_image;
    let resized = if webp_image.is_alpha() {
        resize_rgba_to_rgb_fast(width, height, raw, max_size)?
    } else {
        let (dst_w, dst_h) = calculate_thumbnail_dimensions(width, height, max_size);
        let expected_len = (width as usize) * (height as usize) * 3;
        if raw.len() < expected_len {
            return Err("WebP RGB buffer too small".to_string());
        }
        let src_ref = fr::images::ImageRef::new(width, height, &raw[..expected_len], fr::PixelType::U8x3)
            .map_err(|e| format!("Failed to wrap WebP RGB source: {:?}", e))?;
        let mut dst_image = fr::images::Image::new(dst_w, dst_h, fr::PixelType::U8x3);
        let mut resizer = fr::Resizer::new();
        resizer
            .resize(&src_ref, &mut dst_image, None)
            .map_err(|e| format!("Fast WebP RGB resize failed: {:?}", e))?;
        image::RgbImage::from_raw(dst_w, dst_h, dst_image.into_vec())
            .ok_or_else(|| "Failed to construct RgbImage from resized buffer".to_string())?
    };

    save_image_as_thumbnail(&resized, target_cache_path)
}

pub fn generate_thumbnail(source_path: &Path, target_cache_path: &Path, max_size: u32) -> Result<PathBuf, String> {
    let img = image::open(source_path)
        .map_err(|e| format!("Failed to open image {:?}: {}", source_path, e))?;

    let resized = if img.color().has_alpha() {
        let rgba = img.to_rgba8();
        resize_rgba_to_rgb_fast(rgba.width(), rgba.height(), rgba.as_raw(), max_size)?
    } else {
        let rgb = img.to_rgb8();
        resize_image_fast(&rgb, max_size)?
    };

    save_image_as_thumbnail(&resized, target_cache_path)
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

    // Fast-path 1: Embedded EXIF thumbnail for JPEG
    if ext == "jpg" || ext == "jpeg" {
        if let Some(thumb_path) = try_extract_exif_thumbnail(first_image_path, target_cache_path) {
            return Ok(thumb_path);
        }
    }

    // Fast-path 1.5: High-speed native libwebp decoding for WebP
    if ext == "webp" {
        if let Ok(thumb_path) = generate_webp_thumbnail_fast(first_image_path, target_cache_path, size) {
            return Ok(thumb_path);
        }
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
    let cache_dir = get_thumbnail_cache_dir(app)?;

    // Handle ZIP files and virtual ZIP paths
    if crate::zip_handler::is_zip_path(path_str) {
        if let Some((zip_path, inner_path)) = crate::zip_handler::parse_zip_path(path_str) {
            if !zip_path.exists() {
                return Err(format!("ZIP file does not exist: {:?}", zip_path));
            }
            let (zip_size, zip_modified, _) = get_path_metadata(&zip_path);

            if inner_path.is_empty() {
                // ZIP cover thumbnail
                if let Some(cached) = get_cached_thumbnail_path(&cache_dir, &zip_path, zip_modified, zip_size, size) {
                    return Ok(cached.to_string_lossy().to_string());
                }
                let (bytes, _, _) = crate::zip_handler::read_first_image_bytes(&zip_path)?;
                let filename = compute_thumbnail_filename(&zip_path, zip_modified, zip_size, size);
                let target = cache_dir.join(filename);
                let thumb_path = generate_thumbnail_from_bytes(&bytes, &target, size)?;
                return Ok(thumb_path.to_string_lossy().to_string());
            } else {
                // Specific image inside ZIP
                let virtual_p = Path::new(path_str);
                if let Some(cached) = get_cached_thumbnail_path(&cache_dir, virtual_p, zip_modified, zip_size, size) {
                    return Ok(cached.to_string_lossy().to_string());
                }
                let (bytes, _) = crate::zip_handler::read_zip_entry_bytes(&zip_path, &inner_path)?;
                let filename = compute_thumbnail_filename(virtual_p, zip_modified, zip_size, size);
                let target = cache_dir.join(filename);
                let thumb_path = generate_thumbnail_from_bytes(&bytes, &target, size)?;
                return Ok(thumb_path.to_string_lossy().to_string());
            }
        }
    }

    let p = Path::new(path_str);
    if !p.exists() {
        return Err(format!("File or directory does not exist: {}", path_str));
    }

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

        // Fast-path 1: Embedded EXIF thumbnail for JPEG
        if ext == "jpg" || ext == "jpeg" {
            if let Some(thumb_path) = try_extract_exif_thumbnail(p, &target) {
                return Ok(thumb_path.to_string_lossy().to_string());
            }
        }

        // Fast-path 1.5: High-speed native libwebp decoding for WebP
        if ext == "webp" {
            if let Ok(thumb_path) = generate_webp_thumbnail_fast(p, &target, size) {
                return Ok(thumb_path.to_string_lossy().to_string());
            }
        }

        // Fast-path 2: Windows Shell thumbnail extraction
        #[cfg(windows)]
        {
            if let Ok(thumb_path) = extract_shell_thumbnail(p, &target, size) {
                return Ok(thumb_path.to_string_lossy().to_string());
            }
        }

        // Fast-path 3: Pure-Rust SIMD fast resize (fast_image_resize + buffered JPEG encoder)
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

/// Calculates the concurrency limit based on performance mode and CPU core count.
/// In normal mode, keeps CPU load low (1 to 3 concurrent tasks).
/// In high-performance mode, scales up with available CPU cores (4 to 16 concurrent tasks).
pub fn calculate_concurrency(high_performance: bool, num_cpus: usize) -> usize {
    if high_performance {
        num_cpus.clamp(4, 16)
    } else {
        (num_cpus / 4).clamp(1, 3)
    }
}

/// Manages cancellation and generation state for background thumbnail generation tasks.
#[derive(Debug, Default)]
pub struct ThumbnailManager {
    current_generation: AtomicU64,
}

impl ThumbnailManager {
    pub fn new() -> Self {
        Self {
            current_generation: AtomicU64::new(0),
        }
    }

    pub fn next_generation(&self) -> u64 {
        self.current_generation.fetch_add(1, Ordering::SeqCst) + 1
    }

    pub fn cancel(&self) {
        self.current_generation.fetch_add(1, Ordering::SeqCst);
    }

    pub fn is_current(&self, generation: u64) -> bool {
        self.current_generation.load(Ordering::Relaxed) == generation
    }

    #[allow(dead_code)]
    pub fn current_generation(&self) -> u64 {
        self.current_generation.load(Ordering::Relaxed)
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ThumbnailReadyPayload {
    pub path: String,
    pub thumbnail_path: String,
}

pub async fn run_background_thumbnails(
    app: tauri::AppHandle,
    manager: Arc<ThumbnailManager>,
    paths: Vec<String>,
    high_performance: bool,
    max_size: Option<u32>,
) -> u64 {
    let generation = manager.next_generation();
    let num_cpus = std::thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(4);
    let concurrency = calculate_concurrency(high_performance, num_cpus);

    let semaphore = Arc::new(Semaphore::new(concurrency));
    let app_handle = app.clone();
    let manager_clone = manager.clone();

    tauri::async_runtime::spawn(async move {
        use tauri::Emitter;

        for path in paths {
            if !manager_clone.is_current(generation) {
                break;
            }

            let permit = match semaphore.clone().acquire_owned().await {
                Ok(p) => p,
                Err(_) => break,
            };

            if !manager_clone.is_current(generation) {
                drop(permit);
                break;
            }

            tokio::task::yield_now().await;

            let app_inner = app_handle.clone();
            let path_clone = path.clone();
            let manager_inner = manager_clone.clone();

            tauri::async_runtime::spawn(async move {
                let _permit = permit;
                if !manager_inner.is_current(generation) {
                    return;
                }

                let path_for_blocking = path_clone.clone();
                let app_for_blocking = app_inner.clone();
                let result = tauri::async_runtime::spawn_blocking(move || {
                    get_or_create_thumbnail(&app_for_blocking, &path_for_blocking, max_size)
                })
                .await;

                if !manager_inner.is_current(generation) {
                    return;
                }

                if let Ok(Ok(thumb_path)) = result {
                    let _ = app_inner.emit(
                        "thumbnail-ready",
                        ThumbnailReadyPayload {
                            path: path_clone,
                            thumbnail_path: thumb_path,
                        },
                    );
                }
            });
        }
    });

    generation
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

    #[test]
    fn test_calculate_concurrency() {
        // Normal mode: clamp(num_cpus / 4, 1, 3)
        assert_eq!(calculate_concurrency(false, 1), 1);
        assert_eq!(calculate_concurrency(false, 2), 1);
        assert_eq!(calculate_concurrency(false, 4), 1);
        assert_eq!(calculate_concurrency(false, 8), 2);
        assert_eq!(calculate_concurrency(false, 12), 3);
        assert_eq!(calculate_concurrency(false, 16), 3);
        assert_eq!(calculate_concurrency(false, 64), 3);

        // High performance mode: clamp(num_cpus, 4, 16)
        assert_eq!(calculate_concurrency(true, 1), 4);
        assert_eq!(calculate_concurrency(true, 2), 4);
        assert_eq!(calculate_concurrency(true, 4), 4);
        assert_eq!(calculate_concurrency(true, 8), 8);
        assert_eq!(calculate_concurrency(true, 12), 12);
        assert_eq!(calculate_concurrency(true, 16), 16);
        assert_eq!(calculate_concurrency(true, 32), 16);
    }

    #[test]
    fn test_thumbnail_manager_lifecycle() {
        let manager = ThumbnailManager::new();
        assert_eq!(manager.current_generation(), 0);

        let g1 = manager.next_generation();
        assert_eq!(g1, 1);
        assert!(manager.is_current(g1));
        assert!(!manager.is_current(0));

        let g2 = manager.next_generation();
        assert_eq!(g2, 2);
        assert!(manager.is_current(g2));
        assert!(!manager.is_current(g1));

        manager.cancel();
        assert!(!manager.is_current(g2));
        assert_eq!(manager.current_generation(), 3);
    }

    #[test]
    fn test_calculate_thumbnail_dimensions() {
        assert_eq!(calculate_thumbnail_dimensions(0, 100, 384), (0, 0));
        assert_eq!(calculate_thumbnail_dimensions(100, 0, 384), (0, 0));
        assert_eq!(calculate_thumbnail_dimensions(100, 100, 0), (0, 0));

        // Within bounds
        assert_eq!(calculate_thumbnail_dimensions(200, 150, 384), (200, 150));

        // Landscape
        assert_eq!(calculate_thumbnail_dimensions(1920, 1080, 384), (384, 216));

        // Portrait
        assert_eq!(calculate_thumbnail_dimensions(1080, 1920, 384), (216, 384));

        // Square
        assert_eq!(calculate_thumbnail_dimensions(2000, 2000, 384), (384, 384));
    }

    #[test]
    fn test_resize_image_fast() {
        let src = image::RgbImage::new(100, 50);
        let resized = resize_image_fast(&src, 20).expect("Fast resize should succeed");
        assert_eq!(resized.width(), 20);
        assert_eq!(resized.height(), 10);
    }

    #[test]
    fn test_extract_exif_thumbnail_from_bytes() {
        // Empty or non-jpeg
        assert!(extract_exif_thumbnail_from_bytes(&[]).is_none());
        assert!(extract_exif_thumbnail_from_bytes(&[0xFF, 0xD8]).is_none());
        assert!(extract_exif_thumbnail_from_bytes(&[0x89, 0x50, 0x4E, 0x47]).is_none());

        // JPEG without APP1
        let simple_jpeg = vec![0xFF, 0xD8, 0xFF, 0xD9];
        assert!(extract_exif_thumbnail_from_bytes(&simple_jpeg).is_none());

        // Construct synthetic JPEG with valid Exif IFD1 thumbnail (Little Endian)
        let mut data = Vec::new();
        data.extend_from_slice(&[0xFF, 0xD8]); // SOI
        data.extend_from_slice(&[0xFF, 0xE1]); // APP1 marker

        // APP1 payload: "Exif\0\0" + TIFF header
        let mut tiff = Vec::new();
        // TIFF header: "II" (LE), 42 (0x002A), offset to IFD0 (8)
        tiff.extend_from_slice(b"II");
        tiff.extend_from_slice(&42u16.to_le_bytes());
        tiff.extend_from_slice(&8u32.to_le_bytes()); // IFD0 offset

        // IFD0: 1 entry (dummy tag), then next_ifd_offset to IFD1
        let ifd0_offset = tiff.len();
        assert_eq!(ifd0_offset, 8);
        tiff.extend_from_slice(&1u16.to_le_bytes()); // 1 entry
        // Entry: tag 0x0100 (ImageWidth), type 3 (SHORT), count 1, value 100
        tiff.extend_from_slice(&0x0100u16.to_le_bytes());
        tiff.extend_from_slice(&3u16.to_le_bytes());
        tiff.extend_from_slice(&1u32.to_le_bytes());
        tiff.extend_from_slice(&100u32.to_le_bytes());

        // Next IFD offset: pointing to IFD1
        let ifd1_offset = tiff.len() + 4;
        tiff.extend_from_slice(&(ifd1_offset as u32).to_le_bytes());

        // IFD1: 2 entries: 0x0201 (thumb offset), 0x0202 (thumb length)
        let thumb_bytes = vec![0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0xFF, 0xD9]; // Mock mini JPEG
        let thumb_len = thumb_bytes.len() as u32;

        tiff.extend_from_slice(&2u16.to_le_bytes()); // 2 entries

        // Tag 0x0201: JPEGInterchangeFormat
        let thumb_offset = (tiff.len() + 12 * 2 + 4) as u32;
        tiff.extend_from_slice(&0x0201u16.to_le_bytes());
        tiff.extend_from_slice(&4u16.to_le_bytes()); // LONG
        tiff.extend_from_slice(&1u32.to_le_bytes());
        tiff.extend_from_slice(&thumb_offset.to_le_bytes());

        // Tag 0x0202: JPEGInterchangeFormatLength
        tiff.extend_from_slice(&0x0202u16.to_le_bytes());
        tiff.extend_from_slice(&4u16.to_le_bytes()); // LONG
        tiff.extend_from_slice(&1u32.to_le_bytes());
        tiff.extend_from_slice(&thumb_len.to_le_bytes());

        // Next IFD: 0
        tiff.extend_from_slice(&0u32.to_le_bytes());

        // Thumbnail payload bytes
        assert_eq!(tiff.len(), thumb_offset as usize);
        tiff.extend_from_slice(&thumb_bytes);

        // Assemble APP1 segment
        let mut app1_payload = Vec::new();
        app1_payload.extend_from_slice(b"Exif\0\0");
        app1_payload.extend_from_slice(&tiff);

        let app1_len = (app1_payload.len() + 2) as u16;
        data.extend_from_slice(&app1_len.to_be_bytes());
        data.extend_from_slice(&app1_payload);
        data.extend_from_slice(&[0xFF, 0xD9]); // EOI

        let extracted = extract_exif_thumbnail_from_bytes(&data);
        assert!(extracted.is_some());
        assert_eq!(extracted.unwrap(), &thumb_bytes[..]);
    }

    #[test]
    fn test_save_raw_and_fast_image_thumbnail() {
        let temp_dir = std::env::temp_dir().join("iv_test_save_thumbnails");
        let _ = fs::create_dir_all(&temp_dir);

        // Test save_raw_thumbnail
        let raw_path = temp_dir.join("test_raw.jpg");
        let raw_bytes = b"sample_raw_bytes";
        let res = save_raw_thumbnail(raw_bytes, &raw_path);
        assert!(res.is_ok());
        assert_eq!(fs::read(&raw_path).unwrap(), raw_bytes);

        // Test save_image_as_thumbnail
        let img_path = temp_dir.join("test_img.jpg");
        let test_img = image::RgbImage::new(32, 32);
        let save_res = save_image_as_thumbnail(&test_img, &img_path);
        assert!(save_res.is_ok());
        assert!(img_path.exists());

        // Verify saved image can be decoded
        let loaded = image::open(&img_path);
        assert!(loaded.is_ok());
        let dyn_img = loaded.unwrap();
        assert_eq!(dyn_img.width(), 32);
        assert_eq!(dyn_img.height(), 32);

        let _ = fs::remove_file(&raw_path);
        let _ = fs::remove_file(&img_path);
        let _ = fs::remove_dir(&temp_dir);
    }

    #[test]
    fn test_dynamic_image_to_rgb_with_alpha() {
        // Create 2x1 RGBA image: pixel 0 is 50% transparent red, pixel 1 is fully transparent
        let mut rgba = image::RgbaImage::new(2, 1);
        rgba.put_pixel(0, 0, image::Rgba([255, 0, 0, 128]));
        rgba.put_pixel(1, 0, image::Rgba([0, 0, 0, 0]));

        let dyn_img = image::DynamicImage::ImageRgba8(rgba);
        let rgb = dynamic_image_to_rgb(&dyn_img);

        assert_eq!(rgb.width(), 2);
        assert_eq!(rgb.height(), 1);

        // Pixel 0 should blend red (255) with white (255) -> 255
        // G and B should blend 0 with white (255) -> ~127
        let p0 = rgb.get_pixel(0, 0);
        assert_eq!(p0.0[0], 255);
        assert!((p0.0[1] as i32 - 127).abs() <= 1);
        assert!((p0.0[2] as i32 - 127).abs() <= 1);

        // Pixel 1 (fully transparent) should become pure white (255, 255, 255)
        let p1 = rgb.get_pixel(1, 0);
        assert_eq!(p1.0, [255, 255, 255]);
    }

    #[test]
    fn test_extract_exif_thumbnail_rotated_orientation_skipped() {
        // Construct synthetic JPEG with Exif IFD0 Orientation = 6 (rot 90)
        let mut data = Vec::new();
        data.extend_from_slice(&[0xFF, 0xD8]); // SOI
        data.extend_from_slice(&[0xFF, 0xE1]); // APP1 marker

        let mut tiff = Vec::new();
        tiff.extend_from_slice(b"II");
        tiff.extend_from_slice(&42u16.to_le_bytes());
        tiff.extend_from_slice(&8u32.to_le_bytes()); // IFD0 offset

        // IFD0: 1 entry: Tag 0x0112 (Orientation), type 3 (SHORT), count 1, value 6
        tiff.extend_from_slice(&1u16.to_le_bytes());
        tiff.extend_from_slice(&0x0112u16.to_le_bytes());
        tiff.extend_from_slice(&3u16.to_le_bytes());
        tiff.extend_from_slice(&1u32.to_le_bytes());
        tiff.extend_from_slice(&6u16.to_le_bytes()); // orientation = 6
        tiff.extend_from_slice(&[0u8; 2]); // pad to 4 bytes for value offset

        // Next IFD: IFD1
        let ifd1_offset = tiff.len() + 4;
        tiff.extend_from_slice(&(ifd1_offset as u32).to_le_bytes());

        // IFD1: 2 entries: 0x0201 and 0x0202
        let thumb_bytes = vec![0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0xFF, 0xD9];
        let thumb_len = thumb_bytes.len() as u32;

        tiff.extend_from_slice(&2u16.to_le_bytes());
        let thumb_offset = (tiff.len() + 12 * 2 + 4) as u32;
        tiff.extend_from_slice(&0x0201u16.to_le_bytes());
        tiff.extend_from_slice(&4u16.to_le_bytes());
        tiff.extend_from_slice(&1u32.to_le_bytes());
        tiff.extend_from_slice(&thumb_offset.to_le_bytes());

        tiff.extend_from_slice(&0x0202u16.to_le_bytes());
        tiff.extend_from_slice(&4u16.to_le_bytes());
        tiff.extend_from_slice(&1u32.to_le_bytes());
        tiff.extend_from_slice(&thumb_len.to_le_bytes());

        tiff.extend_from_slice(&0u32.to_le_bytes());
        tiff.extend_from_slice(&thumb_bytes);

        let mut app1_payload = Vec::new();
        app1_payload.extend_from_slice(b"Exif\0\0");
        app1_payload.extend_from_slice(&tiff);

        let app1_len = (app1_payload.len() + 2) as u16;
        data.extend_from_slice(&app1_len.to_be_bytes());
        data.extend_from_slice(&app1_payload);
        data.extend_from_slice(&[0xFF, 0xD9]);

        // When orientation is 6, direct extraction must return None to trigger full rotation pipeline
        let extracted = extract_exif_thumbnail_from_bytes(&data);
        assert!(extracted.is_none());
    }

    #[test]
    fn test_decode_webp_to_rgb_invalid() {
        assert!(decode_webp_to_rgb(&[]).is_err());
        assert!(decode_webp_to_rgb(b"not a webp").is_err());
    }

    #[test]
    fn test_decode_webp_to_rgb_and_generate_webp_thumbnail_fast() {
        let temp_dir = std::env::temp_dir().join("iv_test_webp_fast");
        let _ = fs::create_dir_all(&temp_dir);

        // Encode a synthetic 40x20 RGB WebP image
        let test_pixels = vec![128u8; 40 * 20 * 3];
        let encoder = webp::Encoder::from_rgb(&test_pixels, 40, 20);
        let webp_memory = encoder.encode(80.0);
        assert!(!webp_memory.is_empty());

        // Test decode_webp_to_rgb
        let decoded = decode_webp_to_rgb(&webp_memory);
        assert!(decoded.is_ok());
        let img = decoded.unwrap();
        assert_eq!(img.width(), 40);
        assert_eq!(img.height(), 20);

        // Test generate_webp_thumbnail_fast
        let webp_path = temp_dir.join("sample.webp");
        fs::write(&webp_path, &*webp_memory).unwrap();

        let thumb_path = temp_dir.join("sample_thumb.jpg");
        let gen_res = generate_webp_thumbnail_fast(&webp_path, &thumb_path, 20);
        assert!(gen_res.is_ok());
        assert!(thumb_path.exists());

        // Verify generated thumbnail
        let loaded = image::open(&thumb_path).unwrap();
        assert_eq!(loaded.width(), 20);
        assert_eq!(loaded.height(), 10);

        let _ = fs::remove_file(&webp_path);
        let _ = fs::remove_file(&thumb_path);
        let _ = fs::remove_dir(&temp_dir);
    }

    #[test]
    fn test_blend_rgba_to_rgb() {
        // Opaque
        assert_eq!(blend_rgba_to_rgb(10, 20, 30, 255), (10, 20, 30));
        // Fully transparent -> white
        assert_eq!(blend_rgba_to_rgb(10, 20, 30, 0), (255, 255, 255));
        // Semi-transparent
        let (r, g, b) = blend_rgba_to_rgb(0, 0, 0, 128);
        assert!((r as i32 - 127).abs() <= 1);
        assert!((g as i32 - 127).abs() <= 1);
        assert!((b as i32 - 127).abs() <= 1);
    }

    #[test]
    fn test_generate_webp_thumbnail_fast_with_alpha() {
        let temp_dir = std::env::temp_dir().join("iv_test_webp_alpha_fast");
        let _ = fs::create_dir_all(&temp_dir);

        // Encode a synthetic 40x20 RGBA WebP image (transparent)
        let mut test_pixels = vec![0u8; 40 * 20 * 4];
        for chunk in test_pixels.chunks_exact_mut(4) {
            chunk[0] = 255; // Red
            chunk[1] = 0;
            chunk[2] = 0;
            chunk[3] = 128; // 50% alpha
        }

        let encoder = webp::Encoder::from_rgba(&test_pixels, 40, 20);
        let webp_memory = encoder.encode(80.0);
        assert!(!webp_memory.is_empty());

        let webp_path = temp_dir.join("alpha.webp");
        fs::write(&webp_path, &*webp_memory).unwrap();

        let thumb_path = temp_dir.join("alpha_thumb.jpg");
        let gen_res = generate_webp_thumbnail_fast(&webp_path, &thumb_path, 20);
        assert!(gen_res.is_ok());
        assert!(thumb_path.exists());

        let loaded = image::open(&thumb_path).unwrap();
        assert_eq!(loaded.width(), 20);
        assert_eq!(loaded.height(), 10);

        let _ = fs::remove_file(&webp_path);
        let _ = fs::remove_file(&thumb_path);
        let _ = fs::remove_dir(&temp_dir);
    }
}
