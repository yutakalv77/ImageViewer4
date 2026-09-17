/**
 * Pure utility functions and constants for viewer zoom and pan feature
 */

export const MIN_ZOOM_SCALE = 0.5;
export const MAX_ZOOM_SCALE = 10.0;
export const FIT_ZOOM_SCALE = 1.0;
export const WHEEL_ZOOM_SPEED = 0.0015;
export const KEYBOARD_ZOOM_FACTOR = 1.25;
export const DRAG_THRESHOLD_PX = 5;

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ZoomPanState {
  scale: number;
  offset: Point;
}

/**
 * Clamps scale within [MIN_ZOOM_SCALE, MAX_ZOOM_SCALE] and rounds to 3 decimal places.
 */
export function clampScale(scale: number): number {
  const clamped = Math.max(MIN_ZOOM_SCALE, Math.min(MAX_ZOOM_SCALE, scale));
  return Math.round(clamped * 1000) / 1000;
}

/**
 * Calculates new offset when zooming centered on a specific cursor point relative to the container center.
 * Formula: offset_new = cursorRel - (cursorRel - offset_prev) * (newScale / prevScale)
 */
export function calculateZoomOffset(
  prevScale: number,
  newScale: number,
  prevOffset: Point,
  cursorRelCenter: Point
): Point {
  if (prevScale <= 0) return { x: 0, y: 0 };
  const ratio = newScale / prevScale;
  return {
    x: Math.round(cursorRelCenter.x - (cursorRelCenter.x - prevOffset.x) * ratio),
    y: Math.round(cursorRelCenter.y - (cursorRelCenter.y - prevOffset.y) * ratio),
  };
}

/**
 * Clamps pan offset so the content doesn't completely disappear from the container viewport.
 * When scale <= 1.0, offset is strictly reset to (0, 0).
 */
export function clampOffset(offset: Point, scale: number, containerSize: Size): Point {
  if (scale <= 1.0) {
    return { x: 0, y: 0 };
  }

  // Allow dragging up to max offset based on scaled dimensions
  const maxOffsetX = Math.max(0, (containerSize.width / 2) * (scale - 0.2));
  const maxOffsetY = Math.max(0, (containerSize.height / 2) * (scale - 0.2));

  return {
    x: Math.max(-maxOffsetX, Math.min(maxOffsetX, offset.x)),
    y: Math.max(-maxOffsetY, Math.min(maxOffsetY, offset.y)),
  };
}

/**
 * Calculates new scale and offset from mouse wheel delta, zooming into the cursor position.
 */
export function calculateWheelZoom(
  prevScale: number,
  prevOffset: Point,
  cursorPos: Point,
  containerSize: Size,
  deltaY: number
): ZoomPanState {
  // Delta factor
  const zoomFactor = Math.exp(-deltaY * WHEEL_ZOOM_SPEED);
  const newScale = clampScale(prevScale * zoomFactor);

  if (newScale === prevScale) {
    return { scale: prevScale, offset: prevOffset };
  }

  if (newScale <= 1.0) {
    return { scale: 1.0, offset: { x: 0, y: 0 } };
  }

  // Cursor position relative to container center
  const cursorRelCenter: Point = {
    x: cursorPos.x - containerSize.width / 2,
    y: cursorPos.y - containerSize.height / 2,
  };

  const rawOffset = calculateZoomOffset(prevScale, newScale, prevOffset, cursorRelCenter);
  const clampedOffset = clampOffset(rawOffset, newScale, containerSize);

  return {
    scale: newScale,
    offset: clampedOffset,
  };
}

/**
 * Calculates step zoom (e.g. keyboard + / -) centered at the viewport center.
 */
export function calculateStepZoom(
  prevScale: number,
  prevOffset: Point,
  containerSize: Size,
  direction: "in" | "out"
): ZoomPanState {
  const factor = direction === "in" ? KEYBOARD_ZOOM_FACTOR : 1 / KEYBOARD_ZOOM_FACTOR;
  const newScale = clampScale(prevScale * factor);

  if (newScale <= 1.0) {
    return { scale: 1.0, offset: { x: 0, y: 0 } };
  }

  // Center zoom (cursorRelCenter is (0, 0))
  const rawOffset = calculateZoomOffset(prevScale, newScale, prevOffset, { x: 0, y: 0 });
  const clampedOffset = clampOffset(rawOffset, newScale, containerSize);

  return {
    scale: newScale,
    offset: clampedOffset,
  };
}

/**
 * Checks if drag distance between start and current exceeds threshold.
 */
export function isDragThresholdExceeded(
  startPos: Point,
  currentPos: Point,
  threshold: number = DRAG_THRESHOLD_PX
): boolean {
  const dx = currentPos.x - startPos.x;
  const dy = currentPos.y - startPos.y;
  return dx * dx + dy * dy >= threshold * threshold;
}

/**
 * Formats scale as a percentage string (e.g. 1.5 -> "150%")
 */
export function formatZoomPercent(scale: number): string {
  return `${Math.round(scale * 100)}%`;
}
