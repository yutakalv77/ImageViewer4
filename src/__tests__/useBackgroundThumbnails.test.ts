import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBackgroundThumbnails } from '../hooks/useBackgroundThumbnails';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { EntryItem } from '../types';
import { getCachedThumbnailPath, clearThumbnailMemoryCache } from '../utils/thumbnailCache';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}));

describe('useBackgroundThumbnails hook', () => {
  let eventCallback: ((event: any) => void) | null = null;
  const mockUnlisten = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    clearThumbnailMemoryCache();
    (invoke as any).mockResolvedValue(1);
    (listen as any).mockImplementation((_event: string, cb: any) => {
      eventCallback = cb;
      return Promise.resolve(mockUnlisten);
    });
  });

  const sampleEntries: EntryItem[] = [
    { name: 'folder1', path: 'C:/photos/folder1', is_dir: true, thumbnail_path: null },
    { name: 'img1.jpg', path: 'C:/photos/img1.jpg', is_dir: false, thumbnail_path: null },
    { name: 'img2.jpg', path: 'C:/photos/img2.jpg', is_dir: false, thumbnail_path: 'C:/cache/img2.jpg' },
    { name: 'img3.jpg', path: 'C:/photos/img3.jpg', is_dir: false, thumbnail_path: null },
  ];

  it('starts background generation for only un-cached image entries', () => {
    renderHook(() =>
      useBackgroundThumbnails({
        entries: sampleEntries,
        highPerformanceMode: false,
      })
    );

    expect(invoke).toHaveBeenCalledWith('start_background_thumbnails', {
      paths: ['C:/photos/img1.jpg', 'C:/photos/img3.jpg'],
      highPerformance: false,
    });
  });

  it('passes highPerformanceMode: true to invoke', () => {
    renderHook(() =>
      useBackgroundThumbnails({
        entries: sampleEntries,
        highPerformanceMode: true,
      })
    );

    expect(invoke).toHaveBeenCalledWith('start_background_thumbnails', {
      paths: ['C:/photos/img1.jpg', 'C:/photos/img3.jpg'],
      highPerformance: true,
    });
  });

  it('does not invoke start_background_thumbnails if no un-cached images exist', () => {
    const cachedEntries: EntryItem[] = [
      { name: 'folder1', path: 'C:/photos/folder1', is_dir: true, thumbnail_path: null },
      { name: 'img2.jpg', path: 'C:/photos/img2.jpg', is_dir: false, thumbnail_path: 'C:/cache/img2.jpg' },
    ];

    renderHook(() =>
      useBackgroundThumbnails({
        entries: cachedEntries,
        highPerformanceMode: false,
      })
    );

    expect(invoke).not.toHaveBeenCalledWith('start_background_thumbnails', expect.anything());
  });

  it('cancels background thumbnails on unmount', async () => {
    const { unmount } = renderHook(() =>
      useBackgroundThumbnails({
        entries: sampleEntries,
        highPerformanceMode: false,
      })
    );

    unmount();

    expect(invoke).toHaveBeenCalledWith('cancel_background_thumbnails');
    await waitFor(() => {
      expect(mockUnlisten).toHaveBeenCalled();
    });
  });

  it('updates memory cache and calls onThumbnailReady when thumbnail-ready event fires', () => {
    const onThumbnailReady = vi.fn();

    renderHook(() =>
      useBackgroundThumbnails({
        entries: sampleEntries,
        highPerformanceMode: false,
        onThumbnailReady,
      })
    );

    expect(eventCallback).toBeTypeOf('function');

    eventCallback!({
      payload: {
        path: 'C:/photos/img1.jpg',
        thumbnail_path: 'C:/cache/img1_thumb.jpg',
      },
    });

    expect(getCachedThumbnailPath('C:/photos/img1.jpg')).toBe('C:/cache/img1_thumb.jpg');
    expect(onThumbnailReady).toHaveBeenCalledWith('C:/photos/img1.jpg', 'C:/cache/img1_thumb.jpg');
  });
});
