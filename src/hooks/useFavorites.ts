import { useState, useEffect, useCallback } from "react";
import { readTextFile, writeTextFile, exists, mkdir } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { FavoriteEntry } from "../types";

export function useFavorites(dataStoragePath: string) {
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const getFilePath = useCallback(async () => {
    return await join(dataStoragePath, "favorites.json");
  }, [dataStoragePath]);

  const loadFavorites = useCallback(async () => {
    if (!dataStoragePath) return;
    try {
      if (!(await exists(dataStoragePath))) {
        await mkdir(dataStoragePath, { recursive: true });
      }
      const filePath = await getFilePath();
      if (await exists(filePath)) {
        const content = await readTextFile(filePath);
        const data = JSON.parse(content);
        setFavorites(data);
      }
    } catch (e) {
      console.error("Failed to load favorites:", e);
    } finally {
      setIsLoaded(true);
    }
  }, [dataStoragePath, getFilePath]);

  const saveFavorites = useCallback(async (newFavorites: FavoriteEntry[]) => {
    try {
      const filePath = await getFilePath();
      await writeTextFile(filePath, JSON.stringify(newFavorites, null, 2));
      setFavorites(newFavorites);
    } catch (e) {
      console.error("Failed to save favorites:", e);
    }
  }, [getFilePath]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const toggleFavorite = useCallback(async (path: string) => {
    const isFav = favorites.some(f => f.path === path);
    let nextFavorites;
    if (isFav) {
      nextFavorites = favorites.filter(f => f.path !== path);
    } else {
      nextFavorites = [...favorites, { path, addedAt: Date.now() }];
    }
    await saveFavorites(nextFavorites);
  }, [favorites, saveFavorites]);

  const isFavorite = useCallback((path: string) => {
    return favorites.some(f => f.path === path);
  }, [favorites]);

  const updateAllFavorites = useCallback(async (newFavorites: FavoriteEntry[]) => {
    await saveFavorites(newFavorites);
  }, [saveFavorites]);

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    updateAllFavorites,
    isLoaded
  };
}
