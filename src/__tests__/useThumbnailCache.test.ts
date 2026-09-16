import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useThumbnailCache } from "../hooks/useThumbnailCache";
import { invoke } from "@tauri-apps/api/core";
import { confirm } from "@tauri-apps/plugin-dialog";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "settings.cache_title": "サムネイルキャッシュ",
        "settings.cache_clear_confirm": "キャッシュをクリアしてもいいですか？",
      };
      return translations[key] || key;
    },
  }),
}));

describe("useThumbnailCache hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches thumbnail cache size on mount", async () => {
    (invoke as any).mockImplementation((cmd: string) => {
      if (cmd === "get_thumbnail_cache_size") return Promise.resolve(1048576); // 1 MB
      return Promise.resolve();
    });

    const { result } = renderHook(() => useThumbnailCache());

    await waitFor(() => {
      expect(result.current.cacheSize).toBe(1048576);
    });

    expect(result.current.isClearing).toBe(false);
  });

  it("clears cache and refreshes size when confirmation is confirmed", async () => {
    let size = 2097152;
    (invoke as any).mockImplementation((cmd: string) => {
      if (cmd === "get_thumbnail_cache_size") return Promise.resolve(size);
      if (cmd === "clear_thumbnail_cache") {
        size = 0;
        return Promise.resolve(10);
      }
      return Promise.resolve();
    });
    (confirm as any).mockResolvedValue(true);

    const { result } = renderHook(() => useThumbnailCache());

    await waitFor(() => {
      expect(result.current.cacheSize).toBe(2097152);
    });

    let success = false;
    await act(async () => {
      success = await result.current.clearCache();
    });

    expect(confirm).toHaveBeenCalledWith(
      "キャッシュをクリアしてもいいですか？",
      expect.objectContaining({
        title: "サムネイルキャッシュ",
        kind: "warning",
      })
    );
    expect(invoke).toHaveBeenCalledWith("clear_thumbnail_cache");
    expect(success).toBe(true);
    expect(result.current.cacheSize).toBe(0);
  });

  it("does not clear cache when confirmation is cancelled", async () => {
    (invoke as any).mockImplementation((cmd: string) => {
      if (cmd === "get_thumbnail_cache_size") return Promise.resolve(2097152);
      return Promise.resolve();
    });
    (confirm as any).mockResolvedValue(false);

    const { result } = renderHook(() => useThumbnailCache());

    await waitFor(() => {
      expect(result.current.cacheSize).toBe(2097152);
    });

    let success = false;
    await act(async () => {
      success = await result.current.clearCache();
    });

    expect(invoke).not.toHaveBeenCalledWith("clear_thumbnail_cache");
    expect(success).toBe(false);
    expect(result.current.cacheSize).toBe(2097152);
  });

  it("sets cacheSize to 0 if get_thumbnail_cache_size fails", async () => {
    (invoke as any).mockRejectedValueOnce(new Error("Disk error"));

    const { result } = renderHook(() => useThumbnailCache());

    await waitFor(() => {
      expect(result.current.cacheSize).toBe(0);
    });
  });
});
