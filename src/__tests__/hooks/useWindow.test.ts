import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWindow } from '../../hooks/useWindow';
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

  it('toggleVerticalMaximize で作業領域の上下いっぱいにフィットし、再度呼ぶと元の位置・高さに復元されること（順序の安全性の検証含む）', async () => {
    const mockWindow = getCurrentWindow();
    let currentPos = { x: 120, y: 80 };
    let currentSize = { width: 850, height: 600 };
    const callOrder: string[] = [];

    (mockWindow.outerPosition as any).mockImplementation(() => Promise.resolve({ ...currentPos }));
    (mockWindow.outerSize as any).mockImplementation(() => Promise.resolve({ ...currentSize }));
    (mockWindow.setPosition as any).mockImplementation((pos: any) => {
      callOrder.push("setPosition");
      currentPos = { x: pos.x, y: pos.y };
      return Promise.resolve();
    });
    (mockWindow.setSize as any).mockImplementation((size: any) => {
      callOrder.push("setSize");
      currentSize = { width: size.width, height: size.height };
      return Promise.resolve();
    });

    const { result } = renderHook(() => useWindow());

    // 1回目: 垂直フィット（拡大時は先に移動してからリサイズすることで下端はみ出しを防止）
    await act(async () => {
      await result.current.toggleVerticalMaximize();
    });

    expect(callOrder).toEqual(["setPosition", "setSize"]);
    expect(mockWindow.setPosition).toHaveBeenCalledWith(expect.objectContaining({ x: 120, y: 0 }));
    expect(mockWindow.setSize).toHaveBeenCalledWith(expect.objectContaining({ width: 850, height: 1040 }));
    expect(currentPos).toEqual({ x: 120, y: 0 });
    expect(currentSize).toEqual({ width: 850, height: 1040 });

    callOrder.length = 0;

    // 2回目: 復元（縮小時は先にリサイズしてから移動することで下端はみ出しを防止）
    await act(async () => {
      await result.current.toggleVerticalMaximize();
    });

    expect(callOrder).toEqual(["setSize", "setPosition"]);
    expect(mockWindow.setPosition).toHaveBeenCalledWith(expect.objectContaining({ x: 120, y: 80 }));
    expect(mockWindow.setSize).toHaveBeenCalledWith(expect.objectContaining({ width: 850, height: 600 }));
    expect(currentPos).toEqual({ x: 120, y: 80 });
    expect(currentSize).toEqual({ width: 850, height: 600 });
  });

  it('currentMonitor が null の場合でも primaryMonitor をフォールバックとして使用できること', async () => {
    const { currentMonitor, primaryMonitor } = await import('@tauri-apps/api/window');
    const mockWindow = getCurrentWindow();

    (currentMonitor as any).mockResolvedValueOnce(null);
    (primaryMonitor as any).mockResolvedValueOnce({
      name: "PrimaryFallback",
      size: { width: 1920, height: 1080 },
      position: { x: 0, y: 0 },
      workArea: {
        position: { x: 0, y: 50 },
        size: { width: 1920, height: 990 },
      },
      scaleFactor: 1,
    });

    (mockWindow.outerPosition as any).mockResolvedValueOnce({ x: 50, y: 100 });
    (mockWindow.outerSize as any).mockResolvedValueOnce({ width: 800, height: 600 });

    const { result } = renderHook(() => useWindow());

    await act(async () => {
      await result.current.toggleVerticalMaximize();
    });

    expect(primaryMonitor).toHaveBeenCalled();
    expect(mockWindow.setPosition).toHaveBeenCalledWith(expect.objectContaining({ x: 50, y: 50 }));
    expect(mockWindow.setSize).toHaveBeenCalledWith(expect.objectContaining({ width: 800, height: 990 }));
  });

  it('最大化中または全画面中は toggleVerticalMaximize が位置やサイズを変更しないこと', async () => {
    const mockWindow = getCurrentWindow();
    (mockWindow.isMaximized as any).mockImplementation(() => Promise.resolve(true));

    const { result } = renderHook(() => useWindow());

    // 初期化の非同期反映を待機
    await act(async () => {
      await Promise.resolve();
    });

    vi.clearAllMocks();

    await act(async () => {
      await result.current.toggleVerticalMaximize();
    });

    expect(mockWindow.setPosition).not.toHaveBeenCalled();
    expect(mockWindow.setSize).not.toHaveBeenCalled();
  });
});
