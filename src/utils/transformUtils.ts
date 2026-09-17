export type RotationAngle = 0 | 90 | 180 | 270;

export interface ImageTransform {
  rotation: RotationAngle;
  flipH: boolean;
  flipV: boolean;
}

export const INITIAL_TRANSFORM: ImageTransform = {
  rotation: 0,
  flipH: false,
  flipV: false,
};

/**
 * Calculates the next rotation angle (0, 90, 180, 270).
 */
export function getNextRotation(
  current: RotationAngle,
  direction: "cw" | "ccw"
): RotationAngle {
  const step = direction === "cw" ? 90 : 270;
  const next = (current + step) % 360;
  return (next >= 0 ? next : next + 360) as RotationAngle;
}

/**
 * Checks if the image is currently transformed (rotated or flipped).
 */
export function isTransformed(transform: ImageTransform): boolean {
  return transform.rotation !== 0 || transform.flipH || transform.flipV;
}

/**
 * Calculates a fit scale for 90deg / 270deg rotation so that the rotated image
 * doesn't overflow the container.
 */
export function calculateFitScale(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
  rotation: RotationAngle
): number {
  if (rotation === 0 || rotation === 180) {
    return 1;
  }
  if (containerWidth <= 0 || containerHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
    return 1;
  }
  // When rotated 90/270 deg, the effective width is imageHeight, and height is imageWidth
  const scaleX = containerWidth / imageHeight;
  const scaleY = containerHeight / imageWidth;
  const fitScale = Math.min(scaleX, scaleY);
  // Only scale down if it exceeds the container bounds
  return fitScale < 1 ? fitScale : 1;
}

/**
 * Calculates fit scale for rotated image considering container and natural dimensions.
 */
export function calculateRotatedFitScale(
  containerWidth: number,
  containerHeight: number,
  naturalWidth: number,
  naturalHeight: number,
  rotation: RotationAngle
): number {
  if (rotation === 0 || rotation === 180) {
    return 1;
  }
  if (
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    naturalWidth <= 0 ||
    naturalHeight <= 0
  ) {
    return 1;
  }

  const baseScale = Math.min(
    containerWidth / naturalWidth,
    containerHeight / naturalHeight,
    1
  );
  const dispW = naturalWidth * baseScale;
  const dispH = naturalHeight * baseScale;

  const fitScale = Math.min(containerWidth / dispH, containerHeight / dispW, 1);
  return fitScale;
}

/**
 * Builds CSS transform string for image rendering.
 */
export function buildTransformStyle(
  transform: ImageTransform,
  fitScale = 1
): string {
  const parts: string[] = [];

  if (transform.rotation !== 0) {
    parts.push(`rotate(${transform.rotation}deg)`);
  }
  if (fitScale !== 1) {
    parts.push(`scale(${Number(fitScale.toFixed(4))})`);
  }
  if (transform.flipH) {
    parts.push("scaleX(-1)");
  }
  if (transform.flipV) {
    parts.push("scaleY(-1)");
  }

  return parts.length > 0 ? parts.join(" ") : "none";
}

/**
 * Returns user-facing badge text for active transformations.
 */
export function getTransformBadgeText(
  transform: ImageTransform,
  t?: (key: string, options?: any) => string
): string {
  const labels: string[] = [];

  if (transform.rotation !== 0) {
    labels.push(`${transform.rotation}° ↻`);
  }

  if (transform.flipH && transform.flipV) {
    const bothLabel = t ? t("view_menu.flip_both", { defaultValue: "上下左右反転" }) : "上下左右反転";
    labels.push(bothLabel);
  } else if (transform.flipH) {
    const flipHLabel = t ? t("view_menu.flip_h", { defaultValue: "左右反転" }) : "左右反転";
    labels.push(`${flipHLabel} ⇄`);
  } else if (transform.flipV) {
    const flipVLabel = t ? t("view_menu.flip_v", { defaultValue: "上下反転" }) : "上下反転";
    labels.push(`${flipVLabel} ⇅`);
  }

  return labels.join(" / ");
}
