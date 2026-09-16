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
});
