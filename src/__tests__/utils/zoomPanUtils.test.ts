import { describe, it, expect } from "vitest";
import {
  clampScale,
  calculateZoomOffset,
  clampOffset,
  calculateWheelZoom,
  calculateStepZoom,
  isDragThresholdExceeded,
  formatZoomPercent,
  calculateActualSizeScale,
  MIN_ZOOM_SCALE,
  MAX_ZOOM_SCALE,
} from "../../utils/zoomPanUtils";

describe("zoomPanUtils", () => {
  describe("clampScale", () => {
    it("スケールが範囲内の場合は丸めてそのまま返すこと", () => {
      expect(clampScale(1.5)).toBe(1.5);
      expect(clampScale(2.3456)).toBe(2.346);
    });

    it("MIN_ZOOM_SCALE未満の場合はMIN_ZOOM_SCALEに制限すること", () => {
      expect(clampScale(0.1)).toBe(MIN_ZOOM_SCALE);
    });

    it("MAX_ZOOM_SCALE超過の場合はMAX_ZOOM_SCALEに制限すること", () => {
      expect(clampScale(20.0)).toBe(MAX_ZOOM_SCALE);
    });
  });

  describe("calculateZoomOffset", () => {
    it("カーソルが中央(0, 0)にある場合、オフセットが比率分拡大されること", () => {
      // prevScale=1.0, newScale=2.0, prevOffset=(0, 0), cursorRel=(0, 0)
      const offset = calculateZoomOffset(1.0, 2.0, { x: 0, y: 0 }, { x: 0, y: 0 });
      expect(offset).toEqual({ x: 0, y: 0 });
    });

    it("カーソルが右下(100, 100)にある場合、カーソル位置を保持するようにオフセットが移動すること", () => {
      // 1.0 -> 2.0 にズーム時、カーソル直下の点が同じ位置に残るようオフセットはマイナス方向へシフト
      const offset = calculateZoomOffset(1.0, 2.0, { x: 0, y: 0 }, { x: 100, y: 100 });
      // 100 - (100 - 0) * (2 / 1) = 100 - 200 = -100
      expect(offset).toEqual({ x: -100, y: -100 });
    });
  });

  describe("clampOffset", () => {
    it("スケールが1.0以下のときは常に(0, 0)を返すこと", () => {
      expect(clampOffset({ x: 100, y: 100 }, 1.0, { width: 1000, height: 800 })).toEqual({
        x: 0,
        y: 0,
      });
      expect(clampOffset({ x: 50, y: 50 }, 0.8, { width: 1000, height: 800 })).toEqual({
        x: 0,
        y: 0,
      });
    });

    it("スケールが拡大されている場合、境界内で制限されること", () => {
      const container = { width: 1000, height: 800 };
      // scale=2.0: maxOffsetX = (1000 / 2) * (2.0 - 0.2) = 500 * 1.8 = 900
      const clampedWithin = clampOffset({ x: 500, y: 300 }, 2.0, container);
      expect(clampedWithin).toEqual({ x: 500, y: 300 });

      const clampedExcess = clampOffset({ x: 2000, y: -2000 }, 2.0, container);
      expect(clampedExcess.x).toBe(900);
      expect(clampedExcess.y).toBe(-720);
    });
  });

  describe("calculateWheelZoom", () => {
    const container = { width: 1000, height: 800 };

    it("ホイール上スクロール(deltaY < 0)でズームインすること", () => {
      const result = calculateWheelZoom(
        1.0,
        { x: 0, y: 0 },
        { x: 500, y: 400 },
        container,
        -100
      );
      expect(result.scale).toBeGreaterThan(1.0);
    });

    it("スケールが1.0以下になったときはオフセットが(0, 0)にリセットされること", () => {
      const result = calculateWheelZoom(
        1.05,
        { x: 20, y: 20 },
        { x: 500, y: 400 },
        container,
        200
      );
      expect(result.scale).toBe(1.0);
      expect(result.offset).toEqual({ x: 0, y: 0 });
    });
  });

  describe("calculateStepZoom", () => {
    const container = { width: 1000, height: 800 };

    it("direction='in'でズームインすること", () => {
      const result = calculateStepZoom(1.0, { x: 0, y: 0 }, container, "in");
      expect(result.scale).toBe(1.25);
    });

    it("direction='out'でズームアウトし、1.0以下で(0, 0)にリセットされること", () => {
      const result = calculateStepZoom(1.2, { x: 10, y: 10 }, container, "out");
      expect(result.scale).toBe(1.0);
      expect(result.offset).toEqual({ x: 0, y: 0 });
    });
  });

  describe("isDragThresholdExceeded", () => {
    it("移動距離が5px未満の場合はfalseを返すこと", () => {
      expect(isDragThresholdExceeded({ x: 10, y: 10 }, { x: 12, y: 13 })).toBe(false);
    });

    it("移動距離が5px以上の場合はtrueを返すこと", () => {
      expect(isDragThresholdExceeded({ x: 10, y: 10 }, { x: 15, y: 10 })).toBe(true);
      expect(isDragThresholdExceeded({ x: 10, y: 10 }, { x: 13, y: 14 })).toBe(true); // 3^2 + 4^2 = 25 >= 25
    });
  });

  describe("formatZoomPercent", () => {
    it("パーセント文字列を正しくフォーマットすること", () => {
      expect(formatZoomPercent(1.0)).toBe("100%");
      expect(formatZoomPercent(1.5)).toBe("150%");
      expect(formatZoomPercent(2.345)).toBe("235%");
    });
  });

  describe("calculateActualSizeScale", () => {
    it("naturalWidthがclientWidthより大きい場合、比率をスケールとして返すこと", () => {
      // 3840 / 1920 = 2.0
      expect(calculateActualSizeScale(3840, 1920)).toBe(2.0);
      // 3000 / 1000 = 3.0
      expect(calculateActualSizeScale(3000, 1000)).toBe(3.0);
    });

    it("naturalWidthがclientWidth以下の場合はフォールバック倍率を返すこと", () => {
      // 800 <= 1000: fallback 2.0
      expect(calculateActualSizeScale(800, 1000)).toBe(2.0);
      // fallback指定
      expect(calculateActualSizeScale(800, 1000, 1.5)).toBe(1.5);
    });

    it("無効な寸法（0以下）の場合はフォールバック倍率を返すこと", () => {
      expect(calculateActualSizeScale(0, 1000)).toBe(2.0);
      expect(calculateActualSizeScale(1000, 0)).toBe(2.0);
    });
  });
});

