/**
 * Pure functions and configuration for viewer wheel navigation
 */

export const DEFAULT_WHEEL_COOLDOWN_MS = 60;
export const DEFAULT_WHEEL_THRESHOLD = 50;
export const DEFAULT_WHEEL_RESET_TIMEOUT_MS = 200;

export interface WheelNavigationState {
  lastWheelTime: number;
  accumulatedDelta: number;
  lastInputTime: number;
}

export interface WheelNavigationOptions {
  cooldownMs?: number;
  threshold?: number;
  resetTimeoutMs?: number;
}

export interface WheelNavigationResult {
  direction: "next" | "prev" | null;
  nextState: WheelNavigationState;
}

/**
 * Normalizes wheel event deltaY based on deltaMode.
 * - deltaMode 0 (PIXEL): as-is
 * - deltaMode 1 (LINE): scaled by 33px per line
 * - deltaMode 2 (PAGE): scaled by 100px per page
 */
export function normalizeWheelDeltaY(e: { deltaY: number; deltaMode?: number }): number {
  if (e.deltaMode === 1) {
    return e.deltaY * 33;
  }
  if (e.deltaMode === 2) {
    return e.deltaY * 100;
  }
  return e.deltaY;
}

/**
 * Pure evaluation function for wheel-based navigation (next/prev image).
 * Accumulates small deltas from trackpads, enforces a small cooldown
 * to prevent accidental double-skips within a single notch, and resets on timeout/direction reversal.
 */
export function evaluateWheelNavigation(
  deltaY: number,
  currentTime: number,
  state: WheelNavigationState,
  options?: WheelNavigationOptions
): WheelNavigationResult {
  const cooldownMs = options?.cooldownMs ?? DEFAULT_WHEEL_COOLDOWN_MS;
  const threshold = options?.threshold ?? DEFAULT_WHEEL_THRESHOLD;
  const resetTimeoutMs = options?.resetTimeoutMs ?? DEFAULT_WHEEL_RESET_TIMEOUT_MS;

  // タイムアウトまたは方向反転で蓄積をリセット
  const isTimedOut = currentTime - state.lastInputTime > resetTimeoutMs;
  const isSignReversed =
    (state.accumulatedDelta > 0 && deltaY < 0) || (state.accumulatedDelta < 0 && deltaY > 0);
  const baseDelta = isTimedOut || isSignReversed ? 0 : state.accumulatedDelta;

  const newAccumulated = baseDelta + deltaY;

  // クールダウン中の場合は遷移を発生させず、蓄積もクランプして暴走を防ぐ
  if (currentTime - state.lastWheelTime < cooldownMs) {
    return {
      direction: null,
      nextState: {
        lastWheelTime: state.lastWheelTime,
        accumulatedDelta: Math.max(-threshold, Math.min(threshold, newAccumulated)),
        lastInputTime: currentTime,
      },
    };
  }

  if (newAccumulated >= threshold) {
    return {
      direction: "next",
      nextState: {
        lastWheelTime: currentTime,
        accumulatedDelta: 0,
        lastInputTime: currentTime,
      },
    };
  }

  if (newAccumulated <= -threshold) {
    return {
      direction: "prev",
      nextState: {
        lastWheelTime: currentTime,
        accumulatedDelta: 0,
        lastInputTime: currentTime,
      },
    };
  }

  return {
    direction: null,
    nextState: {
      lastWheelTime: state.lastWheelTime,
      accumulatedDelta: newAccumulated,
      lastInputTime: currentTime,
    },
  };
}
