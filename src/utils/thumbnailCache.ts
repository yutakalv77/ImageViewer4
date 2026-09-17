import { EntryItem } from "../types";

export type ThumbnailCacheListener = (path: string, thumbnailPath: string) => void;

/**
 * In-memory cache for fast $O(1)$ thumbnail path lookup and cross-component synchronization.
 */
const thumbnailMemoryCache = new Map<string, string>();
const cacheListeners = new Set<ThumbnailCacheListener>();

/**
 * Gets a cached thumbnail path for the given original image path.
 */
export function getCachedThumbnailPath(path: string): string | undefined {
  return thumbnailMemoryCache.get(path);
}

/**
 * Sets a cached thumbnail path and notifies all registered subscribers.
 */
export function setCachedThumbnailPath(path: string, thumbnailPath: string): void {
  thumbnailMemoryCache.set(path, thumbnailPath);
  for (const listener of cacheListeners) {
    try {
      listener(path, thumbnailPath);
    } catch (e) {
      console.error("Error in thumbnail cache listener:", e);
    }
  }
}

/**
 * Subscribes to new thumbnail cache entries. Returns an unsubscribe function.
 */
export function subscribeThumbnailCache(listener: ThumbnailCacheListener): () => void {
  cacheListeners.add(listener);
  return () => {
    cacheListeners.delete(listener);
  };
}

/**
 * Clears all cached thumbnail paths in memory.
 */
export function clearThumbnailMemoryCache(): void {
  thumbnailMemoryCache.clear();
}

/**
 * Clears all registered cache listeners (primarily for test cleanup).
 */
export function clearThumbnailCacheListeners(): void {
  cacheListeners.clear();
}

/**
 * Pure function to extract image paths that are not yet cached on disk or in memory.
 */
export function extractUncachedImagePaths(
  entries: EntryItem[],
  isMemoryCached: (path: string) => boolean = (p) => Boolean(getCachedThumbnailPath(p))
): string[] {
  return entries
    .filter((e) => !e.is_dir && !e.thumbnail_path && !isMemoryCached(e.path))
    .map((e) => e.path);
}
