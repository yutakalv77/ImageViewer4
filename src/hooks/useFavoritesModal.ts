import { useState, useEffect, useCallback, useMemo } from "react";
import { FavoriteEntry, FavoriteSortKey, SortOrder } from "../types";
import { useFileSystemContext } from "../context/FileSystemContext";
import { useUIContext } from "../context/UIContext";
import { sortFavorites } from "../utils/sortUtils";

/**
 * お気に入りモーダルの編集状態・操作（ソート、削除、遷移、保存、クローズ）を管理するカスタムフック
 */
export function useFavoritesModal() {
  const {
    favorites,
    updateAllFavorites,
    loadDirectory,
  } = useFileSystemContext();
  const {
    isFavoritesOpen,
    setIsFavoritesOpen,
    setViewerState,
  } = useUIContext();

  const [tempFavorites, setTempFavorites] = useState<FavoriteEntry[]>([]);
  const [sortKey, setSortKey] = useState<FavoriteSortKey | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  useEffect(() => {
    if (isFavoritesOpen) {
      setTempFavorites([...favorites]);
      setSortKey(null);
      setSortOrder("asc");
    }
  }, [isFavoritesOpen, favorites]);

  const onClose = useCallback(() => {
    setIsFavoritesOpen(false);
  }, [setIsFavoritesOpen]);

  const handleRemove = useCallback((path: string) => {
    setTempFavorites((prev) => prev.filter((f) => f.path !== path));
  }, []);

  const handleNavigate = useCallback(
    (path: string) => {
      setViewerState({ isOpen: false, currentIndex: -1 });
      loadDirectory(path);
      onClose();
    },
    [setViewerState, loadDirectory, onClose]
  );

  const handleSort = useCallback(
    (key: FavoriteSortKey) => {
      setSortOrder((prevOrder) => {
        if (sortKey === key) {
          return prevOrder === "asc" ? "desc" : "asc";
        }
        return "asc";
      });
      setSortKey(key);
    },
    [sortKey]
  );

  const sortedFavorites = useMemo(() => {
    if (!sortKey) return tempFavorites;
    return sortFavorites(tempFavorites, sortKey, sortOrder);
  }, [tempFavorites, sortKey, sortOrder]);

  const handleOk = useCallback(() => {
    updateAllFavorites(sortedFavorites);
    onClose();
  }, [updateAllFavorites, sortedFavorites, onClose]);

  return {
    isOpen: isFavoritesOpen,
    favorites: sortedFavorites,
    sortKey,
    sortOrder,
    onSort: handleSort,
    onClose,
    onRemove: handleRemove,
    onNavigate: handleNavigate,
    onOk: handleOk,
  };
}
