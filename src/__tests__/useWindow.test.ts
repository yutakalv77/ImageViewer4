import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWindow } from '../hooks/useWindow';
import { getCurrentWindow } from '@tauri-apps/api/window';

describe('useWindow hook fullscreen handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態を反映し、toggleFullscreenおよびsetFullscreenで切り替えられること', async () => {
    const mockWindow = getCurrentWindow();
    let isFull = false;
    (mockWindow.isFullscreen as any).mockImplementation(() => Promise.resolve(isFull));
    (mockWindow.setFullscreen as any).mockImplementation((val: boolean) => {
      isFull = val;
      return Promise.resolve();
    });

    const { result } = renderHook(() => useWindow());

    expect(result.current.isFullscreen).toBe(false);

    await act(async () => {
      await result.current.toggleFullscreen();
    });

    expect(mockWindow.setFullscreen).toHaveBeenCalledWith(true);
    expect(result.current.isFullscreen).toBe(true);

    await act(async () => {
      await result.current.setFullscreen(false);
    });

    expect(mockWindow.setFullscreen).toHaveBeenCalledWith(false);
    expect(result.current.isFullscreen).toBe(false);
  });

  it('toggleMaximize で未最大化時は最大化され、最大化時は元に戻ること', async () => {
    const mockWindow = getCurrentWindow();
    let isMax = false;
    (mockWindow.isMaximized as any).mockImplementation(() => Promise.resolve(isMax));
    (mockWindow.maximize as any).mockImplementation(() => {
      isMax = true;
      return Promise.resolve();
    });
    (mockWindow.unmaximize as any).mockImplementation(() => {
      isMax = false;
      return Promise.resolve();
    });

    const { result } = renderHook(() => useWindow());

    // 1. 通常状態から最大化
    await act(async () => {
      await result.current.toggleMaximize();
    });

    expect(mockWindow.maximize).toHaveBeenCalledTimes(1);
    expect(result.current.isMaximized).toBe(true);

    // 2. 最大化状態から元の大きさに戻す
    await act(async () => {
      await result.current.toggleMaximize();
    });

    expect(mockWindow.unmaximize).toHaveBeenCalledTimes(1);
    expect(result.current.isMaximized).toBe(false);
  });

  it('handleDrag はダブルクリック（e.detail > 1）時や左クリック以外ではドラッグ処理を行わないこと', async () => {
    const mockWindow = getCurrentWindow();
    const { result } = renderHook(() => useWindow());

    // 右クリック時 (button = 2) はドラッグしない
    await act(async () => {
      await result.current.handleDrag({ button: 2, detail: 1 } as any);
    });
    expect(mockWindow.startDragging).not.toHaveBeenCalled();

    // シングルクリック時 (button = 0, detail = 1)
    await act(async () => {
      await result.current.handleDrag({ button: 0, detail: 1 } as any);
    });
    expect(mockWindow.startDragging).toHaveBeenCalledTimes(1);

    // ダブルクリック時 (detail = 2) は startDragging を呼ばず onDoubleClick に委譲
    await act(async () => {
      await result.current.handleDrag({ button: 0, detail: 2 } as any);
    });
    expect(mockWindow.startDragging).toHaveBeenCalledTimes(1); // カウントが増えないこと
    expect(mockWindow.unmaximize).not.toHaveBeenCalled(); // mousedownで勝手にunmaximizeされないこと
  });

  it('toggleMaximize は isMaximized API が利用できない場合も安全に状態をトグルすること', async () => {
    const mockWindow = getCurrentWindow();
    const origIsMax = mockWindow.isMaximized;
    // @ts-ignore
    delete mockWindow.isMaximized;

    const { result } = renderHook(() => useWindow());

    // 初期マウント時の非同期状態更新を待機
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isMaximized).toBe(false);

    await act(async () => {
      await result.current.toggleMaximize();
    });
    expect(result.current.isMaximized).toBe(true);

    await act(async () => {
      await result.current.toggleMaximize();
    });
    expect(result.current.isMaximized).toBe(false);

    // 復元
    mockWindow.isMaximized = origIsMax;
  });
});
