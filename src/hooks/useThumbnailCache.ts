import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { confirm } from "@tauri-apps/plugin-dialog";

export interface UseThumbnailCacheResult {
  cacheSize: number | null;
  isClearing: boolean;
  fetchCacheSize: () => Promise<void>;
  clearCache: () => Promise<boolean>;
}

/**
 * Custom hook for managing thumbnail cache size and clearing operations.
 */
export function useThumbnailCache(): UseThumbnailCacheResult {
  const { t } = useTranslation();
  const [cacheSize, setCacheSize] = useState<number | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const fetchCacheSize = useCallback(async () => {
    try {
      const size = await invoke<number>("get_thumbnail_cache_size");
      setCacheSize(size);
    } catch (e) {
      console.error("Failed to get cache size:", e);
      setCacheSize(0);
    }
  }, []);

  useEffect(() => {
    fetchCacheSize();
  }, [fetchCacheSize]);

  const clearCache = useCallback(async (): Promise<boolean> => {
    try {
      const confirmed = await confirm(t("settings.cache_clear_confirm"), {
        title: t("settings.cache_title"),
        kind: "warning",
      });

      if (!confirmed) return false;

      setIsClearing(true);
      await invoke("clear_thumbnail_cache");
      await fetchCacheSize();
      return true;
    } catch (e) {
      console.error("Failed to clear cache:", e);
      return false;
    } finally {
      setIsClearing(false);
    }
  }, [t, fetchCacheSize]);

  return {
    cacheSize,
    isClearing,
    fetchCacheSize,
    clearCache,
  };
}
