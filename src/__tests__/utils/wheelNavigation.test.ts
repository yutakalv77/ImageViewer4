import { describe, it, expect } from "vitest";
import {
  evaluateWheelNavigation,
  normalizeWheelDeltaY,
  WheelNavigationState,
} from "../../utils/wheelNavigationUtils";

describe("wheelNavigation", () => {
  describe("normalizeWheelDeltaY", () => {
    it("deltaMode が 0 (PIXEL) の場合、deltaY そのままの値を返すこと", () => {
      expect(normalizeWheelDeltaY({ deltaY: 100, deltaMode: 0 })).toBe(100);
      expect(normalizeWheelDeltaY({ deltaY: -50 })).toBe(-50);
    });

    it("deltaMode が 1 (LINE) の場合、33倍にスケーリングすること", () => {
      expect(normalizeWheelDeltaY({ deltaY: 3, deltaMode: 1 })).toBe(99);
      expect(normalizeWheelDeltaY({ deltaY: -2, deltaMode: 1 })).toBe(-66);
    });

    it("deltaMode が 2 (PAGE) の場合、100倍にスケーリングすること", () => {
      expect(normalizeWheelDeltaY({ deltaY: 1, deltaMode: 2 })).toBe(100);
      expect(normalizeWheelDeltaY({ deltaY: -1, deltaMode: 2 })).toBe(-100);
    });
  });

  describe("evaluateWheelNavigation", () => {
    const initialState: WheelNavigationState = {
      lastWheelTime: 0,
      accumulatedDelta: 0,
      lastInputTime: 0,
    };

    it("単発の1ノッチ操作（deltaY >= 50）で即座に next を返し、蓄積がリセットされること", () => {
      const result = evaluateWheelNavigation(100, 1000, initialState);
      expect(result.direction).toBe("next");
      expect(result.nextState.lastWheelTime).toBe(1000);
      expect(result.nextState.accumulatedDelta).toBe(0);
      expect(result.nextState.lastInputTime).toBe(1000);
    });

    it("単発の1ノッチ逆回転操作（deltaY <= -50）で即座に prev を返すこと", () => {
      const result = evaluateWheelNavigation(-100, 1000, initialState);
      expect(result.direction).toBe("prev");
      expect(result.nextState.lastWheelTime).toBe(1000);
      expect(result.nextState.accumulatedDelta).toBe(0);
    });

    it("閾値未満の微小操作では遷移せず、デルタが蓄積されること", () => {
      const result = evaluateWheelNavigation(20, 1000, initialState);
      expect(result.direction).toBe(null);
      expect(result.nextState.accumulatedDelta).toBe(20);
      expect(result.nextState.lastWheelTime).toBe(0);
    });

    it("微小操作が複数回累積して閾値に達した時に next が発火すること", () => {
      const state1 = evaluateWheelNavigation(25, 1000, initialState).nextState;
      expect(state1.accumulatedDelta).toBe(25);

      const result2 = evaluateWheelNavigation(30, 1010, state1);
      expect(result2.direction).toBe("next");
      expect(result2.nextState.accumulatedDelta).toBe(0);
      expect(result2.nextState.lastWheelTime).toBe(1010);
    });

    it("クールダウン期間中（DEFAULT_WHEEL_COOLDOWN_MS 未満）の追加入力は遷移を発生させないこと", () => {
      // 1回目の入力で遷移
      const result1 = evaluateWheelNavigation(100, 1000, initialState);
      expect(result1.direction).toBe("next");

      // 30ms 後の追加入力（クールダウン 60ms 未満）
      const result2 = evaluateWheelNavigation(100, 1030, result1.nextState);
      expect(result2.direction).toBe(null);
      expect(result2.nextState.lastWheelTime).toBe(1000);
    });

    it("クールダウン経過後（60ms 経過後）の追加入力で即座に次の遷移が発生すること（高速連続スクロール）", () => {
      const result1 = evaluateWheelNavigation(100, 1000, initialState);
      expect(result1.direction).toBe("next");

      // 70ms 後（クールダウン 60ms 経過後）に2ノッチ目の入力
      const result2 = evaluateWheelNavigation(100, 1070, result1.nextState);
      expect(result2.direction).toBe("next");
      expect(result2.nextState.lastWheelTime).toBe(1070);

      // さらに 70ms 後に3ノッチ目の入力
      const result3 = evaluateWheelNavigation(100, 1140, result2.nextState);
      expect(result3.direction).toBe("next");
      expect(result3.nextState.lastWheelTime).toBe(1140);
    });

    it("操作の間隔が resetTimeoutMs を超えた場合、過去の蓄積がリセットされること", () => {
      const state1 = evaluateWheelNavigation(20, 1000, initialState).nextState;
      expect(state1.accumulatedDelta).toBe(20);

      // 300ms 放置（resetTimeoutMs 200ms 超過）後の入力
      const result2 = evaluateWheelNavigation(20, 1300, state1);
      expect(result2.direction).toBe(null);
      // 過去の20は破棄され、今回の20のみ蓄積
      expect(result2.nextState.accumulatedDelta).toBe(20);
    });

    it("回転方向が反転した場合、過去の蓄積がリセットされること", () => {
      const state1 = evaluateWheelNavigation(30, 1000, initialState).nextState;
      expect(state1.accumulatedDelta).toBe(30);

      // 逆方向へ入力
      const result2 = evaluateWheelNavigation(-30, 1020, state1);
      expect(result2.direction).toBe(null);
      // 正の30はリセットされ、-30のみ蓄積
      expect(result2.nextState.accumulatedDelta).toBe(-30);
    });
  });
});
