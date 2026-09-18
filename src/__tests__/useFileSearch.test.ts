import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFileSearch } from "../hooks/useFileSearch";

describe("useFileSearch", () => {
  it("初期状態で searchScope が 'folder' であること", () => {
    const mockLoadDirectory = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useFileSearch({ loadDirectory: mockLoadDirectory })
    );

    expect(result.current.searchScope).toBe("folder");
  });

  it("toggleSearchScope で 'folder' と 'everything' が切り替わること", () => {
    const mockLoadDirectory = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useFileSearch({ loadDirectory: mockLoadDirectory })
    );

    act(() => {
      result.current.toggleSearchScope();
    });
    expect(result.current.searchScope).toBe("everything");

    act(() => {
      result.current.toggleSearchScope();
    });
    expect(result.current.searchScope).toBe("folder");
  });

  it("scope が 'folder' の場合、searchFolders が実行され onSetLastPhysicalPath が呼ばれること", async () => {
    const mockLoadDirectory = vi.fn().mockResolvedValue(undefined);
    const mockOnSetLastPath = vi.fn();
    const { result } = renderHook(() =>
      useFileSearch({
        loadDirectory: mockLoadDirectory,
        onSetLastPhysicalPath: mockOnSetLastPath,
      })
    );

    await act(async () => {
      await result.current.executeSearch({
        query: "cat",
        scope: "folder",
        currentPath: "C:\\images",
        everythingMaxResults: 50,
        everythingCliPath: "es.exe",
      });
    });

    expect(mockLoadDirectory).toHaveBeenCalledWith("virtual:search?q=cat");
    expect(result.current.lastPhysicalPath).toBe("C:\\images");
    expect(mockOnSetLastPath).toHaveBeenCalledWith("C:\\images");
  });

  it("scope が 'everything' かつ正常稼働時の場合、everythingSearch が実行されること", async () => {
    const mockLoadDirectory = vi.fn().mockResolvedValue(undefined);
    const mockCheckRunning = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() =>
      useFileSearch({ loadDirectory: mockLoadDirectory })
    );

    await act(async () => {
      await result.current.executeSearch({
        query: "dog",
        scope: "everything",
        currentPath: "C:\\images",
        everythingEnabled: true,
        everythingMaxResults: 100,
        everythingCliPath: "custom_es.exe",
        checkEverythingRunning: mockCheckRunning,
      });
    });

    expect(mockCheckRunning).toHaveBeenCalled();
    expect(mockLoadDirectory).toHaveBeenCalledWith(
      "virtual:everything?q=dog",
      false,
      100,
      "custom_es.exe"
    );
  });

  it("scope が 'everything' で Everything が停止している場合、エラー通知後に folder 検索にフォールバックすること", async () => {
    const mockLoadDirectory = vi.fn().mockResolvedValue(undefined);
    const mockCheckRunning = vi.fn().mockResolvedValue(false);
    const mockOnError = vi.fn();
    const { result } = renderHook(() =>
      useFileSearch({ loadDirectory: mockLoadDirectory })
    );

    await act(async () => {
      await result.current.executeSearch({
        query: "bird",
        scope: "everything",
        currentPath: "C:\\images",
        everythingEnabled: true,
        everythingMaxResults: 50,
        everythingCliPath: "es.exe",
        checkEverythingRunning: mockCheckRunning,
        onEverythingError: mockOnError,
      });
    });

    expect(mockOnError).toHaveBeenCalled();
    // フォールバックとして folder 検索が呼ばれる
    expect(mockLoadDirectory).toHaveBeenCalledWith("virtual:search?q=bird");
  });
});
