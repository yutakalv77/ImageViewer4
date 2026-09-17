/**
 * Pure utility functions and constants for the magnifier (loupe) feature
 */

export const MIN_ZOOM = 1.5;
export const MAX_ZOOM = 8.0;
export const DEFAULT_ZOOM = 2.5;
export const ZOOM_STEP = 0.5;

export const MIN_LENS_SIZE = 160;
export const MAX_LENS_SIZE = 480;
export const DEFAULT_LENS_SIZE = 240;
export const LENS_SIZE_STEP = 20;

export interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface LensPosition {
  x: number;
  y: number;
}

export interface BackgroundPosition {
  bgX: number;
  bgY: number;
  bgWidth: number;
  bgHeight: number;
}

/**
 * Clamps zoom level within [MIN_ZOOM, MAX_ZOOM] and rounds to 1 decimal place.
 */
export function clampZoom(zoom: number): number {
  const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
  return Math.round(clamped * 10) / 10;
}

/**
 * Steps zoom level up or down by ZOOM_STEP.
 */
export function stepZoom(currentZoom: number, delta: number): number {
  if (delta === 0) return clampZoom(currentZoom);
  const change = delta > 0 ? ZOOM_STEP : -ZOOM_STEP;
  return clampZoom(currentZoom + change);
}

/**
 * Clamps lens size (width/height in px) within [MIN_LENS_SIZE, MAX_LENS_SIZE].
 */
export function clampLensSize(size: number): number {
  return Math.max(MIN_LENS_SIZE, Math.min(MAX_LENS_SIZE, Math.round(size)));
}

/**
 * Steps lens size up or down by LENS_SIZE_STEP.
 */
export function stepLensSize(currentSize: number, delta: number): number {
  if (delta === 0) return clampLensSize(currentSize);
  const change = delta > 0 ? LENS_SIZE_STEP : -LENS_SIZE_STEP;
  return clampLensSize(currentSize + change);
}

/**
 * Computes the top-left position of the lens centered at (cursorX, cursorY)
 * while clamping within the container viewport so it doesn't overflow.
 */
export function calculateLensPosition(
  cursorX: number,
  cursorY: number,
  lensWidth: number,
  lensHeight: number,
  containerWidth: number,
  containerHeight: number
): LensPosition {
  const targetX = cursorX - lensWidth / 2;
  const targetY = cursorY - lensHeight / 2;

  const maxX = Math.max(0, containerWidth - lensWidth);
  const maxY = Math.max(0, containerHeight - lensHeight);

  return {
    x: Math.max(0, Math.min(targetX, maxX)),
    y: Math.max(0, Math.min(targetY, maxY)),
  };
}

/**
 * Computes background position and size for the magnified image
 * so the point under the cursor is aligned to the center of the lens.
 */
export function calculateBackgroundPosition(
  cursorX: number,
  cursorY: number,
  targetRect: RectLike,
  lensWidth: number,
  lensHeight: number,
  zoom: number
): BackgroundPosition {
  const safeWidth = Math.max(1, targetRect.width);
  const safeHeight = Math.max(1, targetRect.height);

  // Relative normalized position on target image [0, 1]
  const rawRatioX = (cursorX - targetRect.left) / safeWidth;
  const rawRatioY = (cursorY - targetRect.top) / safeHeight;

  const ratioX = Math.max(0, Math.min(1, rawRatioX));
  const ratioY = Math.max(0, Math.min(1, rawRatioY));

  const bgWidth = safeWidth * zoom;
  const bgHeight = safeHeight * zoom;

  const bgX = ratioX * bgWidth - lensWidth / 2;
  const bgY = ratioY * bgHeight - lensHeight / 2;

  return {
    bgX,
    bgY,
    bgWidth,
    bgHeight,
  };
}

/**
 * Finds the image element (.viewer-image) under client coordinates,
 * or falls back to the first .viewer-image within the container.
 */
export function findViewerImageElement(
  clientX: number,
  clientY: number,
  container: HTMLElement | null
): HTMLImageElement | null {
  if (!container) return null;

  if (typeof document !== "undefined" && typeof document.elementsFromPoint === "function") {
    const elements = document.elementsFromPoint(clientX, clientY);
    const found = elements.find(
      (el): el is HTMLImageElement =>
        el.tagName === "IMG" && el.classList.contains("viewer-image")
    );
    if (found) return found;
  }

  return container.querySelector<HTMLImageElement>("img.viewer-image");
}

/**
 * Calculates the actual rendered image rectangle inside an <img> element
 * taking object-fit: contain into account.
 */
export function getContainedImageRect(
  elemRect: RectLike,
  naturalWidth: number,
  naturalHeight: number
): RectLike {
  if (naturalWidth <= 0 || naturalHeight <= 0 || elemRect.width <= 0 || elemRect.height <= 0) {
    return elemRect;
  }

  const elemRatio = elemRect.width / elemRect.height;
  const imageRatio = naturalWidth / naturalHeight;

  let renderedWidth = elemRect.width;
  let renderedHeight = elemRect.height;
  let offsetX = 0;
  let offsetY = 0;

  if (imageRatio > elemRatio) {
    // 横長画像：幅いっぱいに合わせて上下に余白
    renderedWidth = elemRect.width;
    renderedHeight = elemRect.width / imageRatio;
    offsetY = (elemRect.height - renderedHeight) / 2;
  } else {
    // 縦長画像：高さいっぱいに合わせて左右に余白
    renderedHeight = elemRect.height;
    renderedWidth = elemRect.height * imageRatio;
    offsetX = (elemRect.width - renderedWidth) / 2;
  }

  return {
    left: elemRect.left + offsetX,
    top: elemRect.top + offsetY,
    width: renderedWidth,
    height: renderedHeight,
  };
}

/**
 * Computes the position of the external information panel (outside the lens).
 * Defaults to below the lens; flips above if there's not enough room at the bottom.
 * Horizontally right-aligned relative to the lens.
 */
export function calculateHelperPosition(
  lensX: number,
  lensY: number,
  lensWidth: number,
  lensHeight: number,
  helperWidth: number,
  helperHeight: number,
  containerWidth: number,
  containerHeight: number
): { x: number; y: number } {
  // Place below lens by default
  let y = lensY + lensHeight + 10;

  // Flip above lens if overflowing bottom
  if (y + helperHeight > containerHeight - 8) {
    y = lensY - helperHeight - 10;
  }

  // Clamp within viewport vertically
  y = Math.max(8, Math.min(y, Math.max(8, containerHeight - helperHeight - 8)));

  // Align to bottom-right relative to lens (right edges aligned)
  let x = lensX + lensWidth - helperWidth;
  x = Math.max(8, Math.min(x, Math.max(8, containerWidth - helperWidth - 8)));

  return {
    x: Math.round(x),
    y: Math.round(y),
  };
}

