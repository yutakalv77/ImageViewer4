import { useState, useEffect, useRef, useCallback } from "react";

export type BadgeFadeState = "active" | "faded" | "hidden";

export interface UseBadgeFadeOptions {
  /** Trigger value (e.g. scale/interaction key). When changed, resets fade timer. */
  triggerKey: any;
  /** Whether the badge should be enabled/shown at all (e.g. isZoomed). */
  enabled: boolean;
  /** Duration in ms before fading to semi-transparent (default: 2000ms). */
  activeDurationMs?: number;
  /** Additional duration in ms after active before hiding completely (default: 2000ms). */
  fadeDurationMs?: number;
}

export interface UseBadgeFadeReturn {
  fadeState: BadgeFadeState;
  isVisible: boolean;
  isHovered: boolean;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  resetTimer: () => void;
}

/**
 * Custom hook to control automatic fading and hiding of temporary badges
 * Timeline: Active (100%) -> [activeDurationMs] -> Faded (semi-transparent) -> [fadeDurationMs] -> Hidden
 */
export function useBadgeFade({
  triggerKey,
  enabled,
  activeDurationMs = 2000,
  fadeDurationMs = 2000,
}: UseBadgeFadeOptions): UseBadgeFadeReturn {
  const [fadeState, setFadeState] = useState<BadgeFadeState>("hidden");
  const [isHovered, setIsHovered] = useState(false);

  const timerFadedRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerHiddenRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerFadedRef.current) {
      clearTimeout(timerFadedRef.current);
      timerFadedRef.current = null;
    }
    if (timerHiddenRef.current) {
      clearTimeout(timerHiddenRef.current);
      timerHiddenRef.current = null;
    }
  }, []);

  const startTimers = useCallback(() => {
    clearTimers();
    setFadeState("active");

    timerFadedRef.current = setTimeout(() => {
      setFadeState("faded");
    }, activeDurationMs);

    timerHiddenRef.current = setTimeout(() => {
      setFadeState("hidden");
    }, activeDurationMs + fadeDurationMs);
  }, [clearTimers, activeDurationMs, fadeDurationMs]);

  // When enabled changes or triggerKey changes (user interacted)
  useEffect(() => {
    if (!enabled) {
      clearTimers();
      setFadeState("hidden");
      return;
    }

    if (!isHovered) {
      startTimers();
    } else {
      clearTimers();
      setFadeState("active");
    }

    return () => {
      clearTimers();
    };
  }, [triggerKey, enabled, isHovered, startTimers, clearTimers]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    clearTimers();
    setFadeState("active");
  }, [clearTimers]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (enabled) {
      startTimers();
    }
  }, [enabled, startTimers]);

  const resetTimer = useCallback(() => {
    if (enabled) {
      startTimers();
    }
  }, [enabled, startTimers]);

  const isVisible = fadeState !== "hidden";

  return {
    fadeState,
    isVisible,
    isHovered,
    handleMouseEnter,
    handleMouseLeave,
    resetTimer,
  };
}
