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

import { DEFAULT_HIGH_PERFORMANCE_MODE } from '../constants';

describe('useSettings hook - highPerformanceMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fsPlugin.exists as any).mockResolvedValue(false);
  });

  it('initializes with default false when no config exists', async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.highPerformanceMode).toBe(DEFAULT_HIGH_PERFORMANCE_MODE);
  });

  it('loads highPerformanceMode from existing config file', async () => {
    (fsPlugin.exists as any).mockResolvedValue(true);
    (fsPlugin.readTextFile as any).mockResolvedValue(
      JSON.stringify({ highPerformanceMode: true })
    );

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.highPerformanceMode).toBe(true);
  });

  it('updates highPerformanceMode and persists to config', async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.updateHighPerformanceMode(true);
    });

    expect(result.current.highPerformanceMode).toBe(true);
    expect(fsPlugin.writeTextFile).toHaveBeenCalledWith(
      expect.stringContaining('config.json'),
      expect.stringContaining('"highPerformanceMode": true')
    );
  });
});

import { DEFAULT_CONFIRM_DELETE } from '../constants';

describe('useSettings hook - confirmDelete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fsPlugin.exists as any).mockResolvedValue(false);
  });

  it('initializes with default true when no config exists', async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.confirmDelete).toBe(DEFAULT_CONFIRM_DELETE);
    expect(result.current.confirmDelete).toBe(true);
  });

  it('loads confirmDelete from existing config file', async () => {
    (fsPlugin.exists as any).mockResolvedValue(true);
    (fsPlugin.readTextFile as any).mockResolvedValue(
      JSON.stringify({ confirmDelete: false })
    );

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.confirmDelete).toBe(false);
  });

  it('updates confirmDelete and persists to config', async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.updateConfirmDelete(false);
    });

    expect(result.current.confirmDelete).toBe(false);
    expect(fsPlugin.writeTextFile).toHaveBeenCalledWith(
      expect.stringContaining('config.json'),
      expect.stringContaining('"confirmDelete": false')
    );
  });
});

