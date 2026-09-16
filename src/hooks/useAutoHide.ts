import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseAutoHideOptions {
  isPinned: boolean;
  isLocked?: boolean;
  hideDelayMs?: number;
  triggerThresholdY?: number;
}

/**
 * 上部メニューバー等のオートハイド（自動非表示・ホバー表示）を管理するカスタムフック
 */
export function useAutoHide(options: UseAutoHideOptions) {
  const {
    isPinned,
    isLocked = false,
    hideDelayMs = 250,
    triggerThresholdY = 6,
  } = options;

  const [isRevealed, setIsRevealed] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const show = useCallback(() => {
    clearHideTimer();
    setIsRevealed(true);
  }, [clearHideTimer]);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setIsRevealed(false);
    }, hideDelayMs);
  }, [clearHideTimer, hideDelayMs]);

  // 固定表示またはロック状態（メニュー展開中等）になった場合は隠蔽タイマーを解除
  useEffect(() => {
    if (isPinned || isLocked) {
      clearHideTimer();
    }
  }, [isPinned, isLocked, clearHideTimer]);

  // ウィンドウ上端マウス移動監視（未固定時のみ）
  useEffect(() => {
    if (isPinned) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY <= triggerThresholdY) {
        show();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isPinned, triggerThresholdY, show]);

  // アンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      clearHideTimer();
    };
  }, [clearHideTimer]);

  const isVisible = isPinned || isRevealed || isLocked;

  return {
    isVisible,
    isRevealed,
    show,
    scheduleHide,
    clearHideTimer,
  };
}
