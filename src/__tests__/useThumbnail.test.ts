import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useThumbnail } from "../hooks/useThumbnail";
import { EntryItem } from "../types";
import { invoke } from "@tauri-apps/api/core";

describe("useThumbnail hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const dummyEntry: EntryItem = {
    name: "test.jpg",
    path: "/photos/test.jpg",
    is_dir: false,
    thumbnail_path: null,
  };

  it("immediately returns thumbSrc if thumbnail_path is already cached", () => {
    const cachedEntry: EntryItem = {
      ...dummyEntry,
      thumbnail_path: "/cache/thumbnails/test_thumb.jpg",
    };

    const elementRef = { current: document.createElement("div") };
    const { result } = renderHook(() => useThumbnail(cachedEntry, elementRef));

    expect(result.current.thumbSrc).toBe("asset:///cache/thumbnails/test_thumb.jpg");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(invoke).not.toHaveBeenCalled();
  });

  it("calls get_thumbnail when thumbnail_path is null", async () => {
    (invoke as any).mockResolvedValue("/cache/thumbnails/generated.jpg");

    const elementRef = { current: document.createElement("div") };
    const { result } = renderHook(() => useThumbnail(dummyEntry, elementRef));

    await waitFor(() => {
      expect(result.current.thumbSrc).toBe("asset:///cache/thumbnails/generated.jpg");
    });

    expect(invoke).toHaveBeenCalledWith("get_thumbnail", { path: dummyEntry.path });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
  });

  it("sets hasError to true when get_thumbnail fails", async () => {
    (invoke as any).mockRejectedValue(new Error("Failed to decode image"));

    const elementRef = { current: document.createElement("div") };
    const { result } = renderHook(() => useThumbnail(dummyEntry, elementRef));

    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.thumbSrc).toBeNull();
  });

  it("onError callback marks hasError as true", () => {
    const cachedEntry: EntryItem = {
      ...dummyEntry,
      thumbnail_path: "/cache/thumbnails/test_thumb.jpg",
    };

    const elementRef = { current: document.createElement("div") };
    const { result } = renderHook(() => useThumbnail(cachedEntry, elementRef));

    act(() => {
      result.current.onError();
    });

    expect(result.current.hasError).toBe(true);
  });
});
