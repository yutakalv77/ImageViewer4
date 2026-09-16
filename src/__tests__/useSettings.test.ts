import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSettings } from '../hooks/useSettings';
import * as fsPlugin from '@tauri-apps/plugin-fs';

describe('useSettings hook - pageNumberPosition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fsPlugin.exists as any).mockResolvedValue(false);
  });

  it('initializes with default bottom-center when no config exists', async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.pageNumberPosition).toBe('bottom-center');
  });

  it('loads pageNumberPosition from existing config file', async () => {
    (fsPlugin.exists as any).mockResolvedValue(true);
    (fsPlugin.readTextFile as any).mockResolvedValue(
      JSON.stringify({ pageNumberPosition: 'top-left' })
    );

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.pageNumberPosition).toBe('top-left');
  });

  it('falls back to bottom-center if config has invalid pageNumberPosition', async () => {
    (fsPlugin.exists as any).mockResolvedValue(true);
    (fsPlugin.readTextFile as any).mockResolvedValue(
      JSON.stringify({ pageNumberPosition: 'invalid-position' })
    );

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.pageNumberPosition).toBe('bottom-center');
  });

  it('updates pageNumberPosition and persists to config', async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.updatePageNumberPosition('top-right');
    });

    expect(result.current.pageNumberPosition).toBe('top-right');
    expect(fsPlugin.writeTextFile).toHaveBeenCalledWith(
      expect.stringContaining('config.json'),
      expect.stringContaining('"pageNumberPosition": "top-right"')
    );
  });
});
