import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useImageSource } from '../../hooks/useImageSource';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: vi.fn((path: string) => `asset://localhost/${encodeURIComponent(path)}`),
  invoke: vi.fn(),
}));

describe('useImageSource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test-blob');
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it('空または無効なパスの場合は null を返すこと', () => {
    const { result } = renderHook(() => useImageSource(''));
    expect(result.current.src).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('通常ファイルパスの場合は convertFileSrc で即座に URL を返すこと', () => {
    const { result } = renderHook(() => useImageSource('C:\\photos\\img1.jpg'));
    expect(result.current.src).toBe('asset://localhost/C%3A%5Cphotos%5Cimg1.jpg');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(invoke).not.toHaveBeenCalled();
  });

  it('ZIP仮想パスの場合は get_zip_image_data を呼び出して Blob URL を生成すること', async () => {
    const mockData = {
      data: [1, 2, 3, 4],
      mime: 'image/jpeg',
    };
    vi.mocked(invoke).mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useImageSource('C:\\comics\\vol1.zip::001.jpg'));

    // 初期状態はローディング
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(invoke).toHaveBeenCalledWith('get_zip_image_data', {
      path: 'C:\\comics\\vol1.zip::001.jpg',
    });
    expect(result.current.src).toBe('blob:http://localhost/test-blob');
    expect(result.current.error).toBeNull();
  });

  it('アンマウント時に Blob URL が revokeObjectURL されること', async () => {
    const mockData = {
      data: [1, 2, 3, 4],
      mime: 'image/png',
    };
    vi.mocked(invoke).mockResolvedValueOnce(mockData);

    const { result, unmount } = renderHook(() => useImageSource('C:\\comics\\vol1.zip::001.png'));

    await waitFor(() => {
      expect(result.current.src).toBe('blob:http://localhost/test-blob');
    });

    unmount();

    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/test-blob');
  });

  it('ZIP画像読み込みエラー時に error を設定すること', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Zip entry not found'));

    const { result } = renderHook(() => useImageSource('C:\\comics\\vol1.zip::notfound.jpg'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.src).toBeNull();
    expect(result.current.error?.message).toBe('Zip entry not found');
  });
});
