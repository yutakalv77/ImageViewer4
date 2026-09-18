import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoHide } from '../../hooks/useAutoHide';

describe('useAutoHide', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ピン留め状態（isPinned: true）では常に isVisible が true である', () => {
    const { result } = renderHook(() => useAutoHide({ isPinned: true }));
    expect(result.current.isVisible).toBe(true);
    expect(result.current.isRevealed).toBe(false);

    act(() => {
      result.current.scheduleHide();
      vi.advanceTimersByTime(500);
    });
    // ピン留めされているため常に true
    expect(result.current.isVisible).toBe(true);
  });

  it('未ピン留め状態（isPinned: false）では初期状態で isVisible が false である', () => {
    const { result } = renderHook(() => useAutoHide({ isPinned: false }));
    expect(result.current.isVisible).toBe(false);
    expect(result.current.isRevealed).toBe(false);
  });

  it('show() を呼び出すと表示され、scheduleHide() で遅延後に非表示になる', () => {
    const { result } = renderHook(() => useAutoHide({ isPinned: false, hideDelayMs: 250 }));

    act(() => {
      result.current.show();
    });
    expect(result.current.isVisible).toBe(true);
    expect(result.current.isRevealed).toBe(true);

    act(() => {
      result.current.scheduleHide();
    });
    // 遅延時間前はまだ表示中
    expect(result.current.isVisible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(250);
    });
    // 遅延時間後に非表示
    expect(result.current.isVisible).toBe(false);
    expect(result.current.isRevealed).toBe(false);
  });

  it('非表示タイマー中に show() が呼ばれた場合はタイマーがキャンセルされる', () => {
    const { result } = renderHook(() => useAutoHide({ isPinned: false, hideDelayMs: 250 }));

    act(() => {
      result.current.show();
      result.current.scheduleHide();
      vi.advanceTimersByTime(100);
      result.current.show();
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });
    // 再び show() されたため非表示にならない
    expect(result.current.isVisible).toBe(true);
    expect(result.current.isRevealed).toBe(true);
  });

  it('ロック状態（isLocked: true）では未ピン留めでも isVisible が true を維持する', () => {
    const { result, rerender } = renderHook(
      ({ isLocked }) => useAutoHide({ isPinned: false, isLocked, hideDelayMs: 250 }),
      { initialProps: { isLocked: false } }
    );
    expect(result.current.isVisible).toBe(false);

    // ロック状態（メニュー展開等）にする
    rerender({ isLocked: true });
    expect(result.current.isVisible).toBe(true);

    // scheduleHide を呼んでもロック中は閉じない
    act(() => {
      result.current.scheduleHide();
      vi.advanceTimersByTime(500);
    });
    expect(result.current.isVisible).toBe(true);
  });

  it('ウィンドウ上端付近（clientY <= triggerThresholdY）のマウス移動で自動表示される', () => {
    const { result } = renderHook(() => useAutoHide({ isPinned: false, triggerThresholdY: 6 }));
    expect(result.current.isVisible).toBe(false);

    // clientY = 4（上端付近）で mousemove を発火
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientY: 4 }));
    });
    expect(result.current.isVisible).toBe(true);
    expect(result.current.isRevealed).toBe(true);
  });
});
