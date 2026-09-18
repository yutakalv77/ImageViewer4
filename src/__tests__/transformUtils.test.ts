import { describe, it, expect } from "vitest";
import {
  INITIAL_TRANSFORM,
  getNextRotation,
  isTransformed,
  calculateFitScale,
  calculateRotatedFitScale,
  buildTransformStyle,
  getTransformBadgeText,
  ImageTransform,
} from "../utils/transformUtils";

describe("transformUtils", () => {
  describe("getNextRotation", () => {
    it("cycles clockwise: 0 -> 90 -> 180 -> 270 -> 0", () => {
      expect(getNextRotation(0, "cw")).toBe(90);
      expect(getNextRotation(90, "cw")).toBe(180);
      expect(getNextRotation(180, "cw")).toBe(270);
      expect(getNextRotation(270, "cw")).toBe(0);
    });

    it("cycles counter-clockwise: 0 -> 270 -> 180 -> 90 -> 0", () => {
      expect(getNextRotation(0, "ccw")).toBe(270);
      expect(getNextRotation(270, "ccw")).toBe(180);
      expect(getNextRotation(180, "ccw")).toBe(90);
      expect(getNextRotation(90, "ccw")).toBe(0);
    });
  });

  describe("isTransformed", () => {
    it("returns false for initial transform", () => {
      expect(isTransformed(INITIAL_TRANSFORM)).toBe(false);
    });

    it("returns true if rotated", () => {
      expect(isTransformed({ rotation: 90, flipH: false, flipV: false })).toBe(true);
      expect(isTransformed({ rotation: 180, flipH: false, flipV: false })).toBe(true);
    });

    it("returns true if flipped horizontally or vertically", () => {
      expect(isTransformed({ rotation: 0, flipH: true, flipV: false })).toBe(true);
      expect(isTransformed({ rotation: 0, flipH: false, flipV: true })).toBe(true);
    });
  });

  describe("calculateFitScale", () => {
    it("returns 1 for 0 and 180 degree rotation", () => {
      expect(calculateFitScale(1920, 1080, 1920, 1080, 0)).toBe(1);
      expect(calculateFitScale(1920, 1080, 1920, 1080, 180)).toBe(1);
    });

    it("scales down when rotated image exceeds container dimensions", () => {
      // Container: 1920x1080, Image rendered: 1920x1080
      // When rotated 90deg, effective size is 1080x1920. Height (1920) exceeds container height (1080).
      // Scale = 1080 / 1920 = 0.5625
      const scale = calculateFitScale(1920, 1080, 1920, 1080, 90);
      expect(scale).toBeCloseTo(1080 / 1920);
    });

    it("does not upscale if rotated image fits inside container", () => {
      // Container: 1920x1080, Image: 400x300.
      // Rotated: 300x400 fits in 1920x1080.
      expect(calculateFitScale(1920, 1080, 400, 300, 90)).toBe(1);
    });

    it("handles zero or negative dimensions safely", () => {
      expect(calculateFitScale(0, 1080, 1920, 1080, 90)).toBe(1);
      expect(calculateFitScale(1920, 0, 1920, 1080, 90)).toBe(1);
      expect(calculateFitScale(1920, 1080, 0, 1080, 90)).toBe(1);
    });
  });

  describe("calculateRotatedFitScale", () => {
    it("returns 1 for 0 and 180 degree rotation", () => {
      expect(calculateRotatedFitScale(1920, 1080, 1920, 1080, 0)).toBe(1);
      expect(calculateRotatedFitScale(1920, 1080, 1920, 1080, 180)).toBe(1);
    });

    it("correctly fits a wide image rotated 90deg inside a wide container", () => {
      // Container 1000x500, Image 1000x500
      // In container, image is displayed at 1000x500.
      // Rotated: effective dimensions are 500x1000.
      // Height 1000 exceeds container height 500 => scale = 500/1000 = 0.5.
      expect(calculateRotatedFitScale(1000, 500, 1000, 500, 90)).toBe(0.5);
      expect(calculateRotatedFitScale(1000, 500, 1000, 500, 270)).toBe(0.5);
    });

    it("returns 1 if dimensions are invalid or <= 0", () => {
      expect(calculateRotatedFitScale(0, 500, 1000, 500, 90)).toBe(1);
      expect(calculateRotatedFitScale(1000, 0, 1000, 500, 90)).toBe(1);
      expect(calculateRotatedFitScale(1000, 500, 0, 500, 90)).toBe(1);
    });
  });

  describe("buildTransformStyle", () => {
    it("returns 'none' for default transform with scale 1", () => {
      expect(buildTransformStyle(INITIAL_TRANSFORM)).toBe("none");
    });

    it("builds correct string for rotation", () => {
      const transform: ImageTransform = { rotation: 90, flipH: false, flipV: false };
      expect(buildTransformStyle(transform)).toBe("rotate(90deg)");
    });

    it("builds correct string for rotation and fitScale", () => {
      const transform: ImageTransform = { rotation: 90, flipH: false, flipV: false };
      expect(buildTransformStyle(transform, 0.75)).toBe("rotate(90deg) scale(0.75)");
    });

    it("builds correct string for flips", () => {
      expect(buildTransformStyle({ rotation: 0, flipH: true, flipV: false })).toBe("scaleX(-1)");
      expect(buildTransformStyle({ rotation: 0, flipH: false, flipV: true })).toBe("scaleY(-1)");
      expect(buildTransformStyle({ rotation: 0, flipH: true, flipV: true })).toBe("scaleX(-1) scaleY(-1)");
    });

    it("builds combined rotation, scale, and flips", () => {
      const transform: ImageTransform = { rotation: 270, flipH: true, flipV: true };
      expect(buildTransformStyle(transform, 0.8)).toBe("rotate(270deg) scale(0.8) scaleX(-1) scaleY(-1)");
    });
  });

  describe("getTransformBadgeText", () => {
    it("returns empty string for initial transform", () => {
      expect(getTransformBadgeText(INITIAL_TRANSFORM)).toBe("");
    });

    it("returns rotation badge text", () => {
      expect(getTransformBadgeText({ rotation: 90, flipH: false, flipV: false })).toBe("90° ↻");
      expect(getTransformBadgeText({ rotation: 180, flipH: false, flipV: false })).toBe("180° ↻");
    });

    it("returns flip badge text", () => {
      expect(getTransformBadgeText({ rotation: 0, flipH: true, flipV: false })).toBe("左右反転 ⇄");
      expect(getTransformBadgeText({ rotation: 0, flipH: false, flipV: true })).toBe("上下反転 ⇅");
      expect(getTransformBadgeText({ rotation: 0, flipH: true, flipV: true })).toBe("上下左右反転");
    });

    it("returns combined badge text", () => {
      expect(getTransformBadgeText({ rotation: 90, flipH: true, flipV: false })).toBe("90° ↻ / 左右反転 ⇄");
    });
  });
});
