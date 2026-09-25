import { describe, it, expect } from "vitest";
import {
  isVerticallyFit,
  calculateVerticalFitBounds,
  WindowBounds,
  WorkArea,
} from "../../utils/windowBoundsUtils";

describe("windowBoundsUtils", () => {
  const workArea: WorkArea = {
    x: 0,
    y: 0,
    width: 1920,
    height: 1040,
  };

  describe("isVerticallyFit", () => {
    it("yとheightがworkAreaと完全に一致する場合、trueを返すこと", () => {
      expect(isVerticallyFit({ y: 0, height: 1040 }, workArea)).toBe(true);
    });

    it("tolerance（許容誤差）内の微小なズレ（±2px）がある場合も、trueを返すこと", () => {
      expect(isVerticallyFit({ y: 1, height: 1039 }, workArea, 2)).toBe(true);
      expect(isVerticallyFit({ y: -1, height: 1042 }, workArea, 2)).toBe(true);
    });

    it("toleranceを超えるズレがある場合、falseを返すこと", () => {
      expect(isVerticallyFit({ y: 10, height: 1040 }, workArea, 2)).toBe(false);
      expect(isVerticallyFit({ y: 0, height: 800 }, workArea, 2)).toBe(false);
      expect(isVerticallyFit({ y: 50, height: 600 }, workArea, 2)).toBe(false);
    });
  });

  describe("calculateVerticalFitBounds", () => {
    it("未フィット状態のとき、workAreaのyとheightに合わせて垂直フィット境界と復元用情報を返すこと", () => {
      const currentBounds: WindowBounds = {
        x: 100,
        y: 150,
        width: 800,
        height: 600,
      };

      const result = calculateVerticalFitBounds(currentBounds, workArea, null);

      expect(result.action).toBe("fit");
      expect(result.nextBounds).toEqual({
        x: 100,
        y: 0,
        width: 800,
        height: 1040,
      });
      expect(result.nextPrevBounds).toEqual({
        y: 150,
        height: 600,
      });
    });

    it("既に垂直フィットしておりprevBoundsが存在する場合、元のyとheightに復元されること", () => {
      const currentBounds: WindowBounds = {
        x: 100,
        y: 0,
        width: 800,
        height: 1040,
      };
      const prevBounds = {
        y: 150,
        height: 600,
      };

      const result = calculateVerticalFitBounds(currentBounds, workArea, prevBounds);

      expect(result.action).toBe("restore");
      expect(result.nextBounds).toEqual({
        x: 100,
        y: 150,
        width: 800,
        height: 600,
      });
      expect(result.nextPrevBounds).toBeNull();
    });

    it("垂直フィット後、手動でリサイズ等されてフィット状態でなくなった場合、再度垂直フィットとして計算されること", () => {
      const currentBounds: WindowBounds = {
        x: 200,
        y: 80,
        width: 900,
        height: 700,
      };
      const oldPrevBounds = {
        y: 150,
        height: 600,
      };

      const result = calculateVerticalFitBounds(currentBounds, workArea, oldPrevBounds);

      expect(result.action).toBe("fit");
      expect(result.nextBounds).toEqual({
        x: 200,
        y: 0,
        width: 900,
        height: 1040,
      });
      expect(result.nextPrevBounds).toEqual({
        y: 80,
        height: 700,
      });
    });

    it("タスクバーが上部にある環境やマルチモニターでworkArea.yが0以外の場合も正しくフィットすること", () => {
      const topTaskbarWorkArea: WorkArea = {
        x: 1920,
        y: 40,
        width: 1920,
        height: 1040,
      };
      const currentBounds: WindowBounds = {
        x: 2000,
        y: 200,
        width: 800,
        height: 500,
      };

      const result = calculateVerticalFitBounds(currentBounds, topTaskbarWorkArea, null);

      expect(result.action).toBe("fit");
      expect(result.nextBounds).toEqual({
        x: 2000,
        y: 40,
        width: 800,
        height: 1040,
      });
      expect(result.nextPrevBounds).toEqual({
        y: 200,
        height: 500,
      });
    });
  });
});
