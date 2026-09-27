import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFavoritesModal } from "../../hooks/useFavoritesModal";
import { FavoriteEntry } from "../../types";

const mockUpdateAllFavorites = vi.fn();
const mockLoadDirectory = vi.fn();
const mockSetIsFavoritesOpen = vi.fn();
const mockSetViewerState = vi.fn();

const initialFavorites: FavoriteEntry[] = [
  { path: "C:/images/pic2.jpg", addedAt: 1000 },
  { path: "C:/images/pic1.jpg", addedAt: 2000 },
  { path: "C:/images/pic10.jpg", addedAt: 1500 },
];

let mockFileSystemContext = {
  favorites: initialFavorites,
  updateAllFavorites: mockUpdateAllFavorites,
  loadDirectory: mockLoadDirectory,
};

let mockUIContext = {
  isFavoritesOpen: true,
  setIsFavoritesOpen: mockSetIsFavoritesOpen,
  setViewerState: mockSetViewerState,
};

vi.mock("../../context/FileSystemContext", () => ({
  useFileSystemContext: () => mockFileSystemContext,
}));

vi.mock("../../context/UIContext", () => ({
  useUIContext: () => mockUIContext,
}));

describe("useFavoritesModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFileSystemContext = {
      favorites: [...initialFavorites],
      updateAllFavorites: mockUpdateAllFavorites,
      loadDirectory: mockLoadDirectory,
    };
    mockUIContext = {
      isFavoritesOpen: true,
      setIsFavoritesOpen: mockSetIsFavoritesOpen,
      setViewerState: mockSetViewerState,
    };
  });

  it("モーダルオープン時にコンテキストのお気に入り一覧が初期化されること", () => {
    const { result } = renderHook(() => useFavoritesModal());

    expect(result.current.isOpen).toBe(true);
    expect(result.current.favorites).toEqual(initialFavorites);
    expect(result.current.sortKey).toBeNull();
    expect(result.current.sortOrder).toBe("asc");
  });

  it("onSort('path') でパス順に昇順、もう一度呼ぶと降順にソートされること", () => {
    const { result } = renderHook(() => useFavoritesModal());

    // 1回目: path 昇順
    act(() => {
      result.current.onSort("path");
    });

    expect(result.current.sortKey).toBe("path");
    expect(result.current.sortOrder).toBe("asc");
    expect(result.current.favorites.map((f) => f.path)).toEqual([
      "C:/images/pic1.jpg",
      "C:/images/pic2.jpg",
      "C:/images/pic10.jpg",
    ]);

    // 2回目: path 降順
    act(() => {
      result.current.onSort("path");
    });

    expect(result.current.sortKey).toBe("path");
    expect(result.current.sortOrder).toBe("desc");
    expect(result.current.favorites.map((f) => f.path)).toEqual([
      "C:/images/pic10.jpg",
      "C:/images/pic2.jpg",
      "C:/images/pic1.jpg",
    ]);
  });

  it("onSort('addedAt') で登録日時順に昇順・降順ソートされること", () => {
    const { result } = renderHook(() => useFavoritesModal());

    act(() => {
      result.current.onSort("addedAt");
    });

    expect(result.current.sortKey).toBe("addedAt");
    expect(result.current.sortOrder).toBe("asc");
    expect(result.current.favorites.map((f) => f.addedAt)).toEqual([1000, 1500, 2000]);

    act(() => {
      result.current.onSort("addedAt");
    });

    expect(result.current.sortKey).toBe("addedAt");
    expect(result.current.sortOrder).toBe("desc");
    expect(result.current.favorites.map((f) => f.addedAt)).toEqual([2000, 1500, 1000]);
  });

  it("onRemoveを呼んだとき、指定パスのアイテムが削除されること", () => {
    const { result } = renderHook(() => useFavoritesModal());

    act(() => {
      result.current.onRemove("C:/images/pic1.jpg");
    });

    expect(result.current.favorites).toHaveLength(2);
    expect(result.current.favorites.find((f) => f.path === "C:/images/pic1.jpg")).toBeUndefined();
  });

  it("onNavigateを呼んだとき、ビューワーを閉じてディレクトリを読み込みモーダルを閉じること", () => {
    const { result } = renderHook(() => useFavoritesModal());

    act(() => {
      result.current.onNavigate("C:/images/pic1.jpg");
    });

    expect(mockSetViewerState).toHaveBeenCalledWith({ isOpen: false, currentIndex: -1 });
    expect(mockLoadDirectory).toHaveBeenCalledWith("C:/images/pic1.jpg");
    expect(mockSetIsFavoritesOpen).toHaveBeenCalledWith(false);
  });

  it("onOkを呼んだとき、ソート後の順序でupdateAllFavoritesが呼ばれモーダルが閉じること", () => {
    const { result } = renderHook(() => useFavoritesModal());

    act(() => {
      result.current.onSort("path");
    });

    act(() => {
      result.current.onOk();
    });

    expect(mockUpdateAllFavorites).toHaveBeenCalledWith([
      { path: "C:/images/pic1.jpg", addedAt: 2000 },
      { path: "C:/images/pic2.jpg", addedAt: 1000 },
      { path: "C:/images/pic10.jpg", addedAt: 1500 },
    ]);
    expect(mockSetIsFavoritesOpen).toHaveBeenCalledWith(false);
  });

  it("onCloseを呼んだとき、setIsFavoritesOpen(false)が呼ばれること", () => {
    const { result } = renderHook(() => useFavoritesModal());

    act(() => {
      result.current.onClose();
    });

    expect(mockSetIsFavoritesOpen).toHaveBeenCalledWith(false);
  });
});
