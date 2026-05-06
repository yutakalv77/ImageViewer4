import { FavoriteEntry, EntryItem } from "../types";

/**
 * Utility for handling virtual paths (e.g., virtual:favorites)
 */

export const VIRTUAL_PATH_PREFIX = "virtual:";
export const VIRTUAL_PATH_FAVORITES = "virtual:favorites";
export const VIRTUAL_PATH_RECENT = "virtual:recent"; // Ready for future use

export function isVirtualPath(path: string | null | undefined): boolean {
  return !!path && path.startsWith(VIRTUAL_PATH_PREFIX);
}

export function getVirtualPathLabel(path: string, t: (key: string) => string): string {
  if (path === VIRTUAL_PATH_FAVORITES) {
    return "★ " + t('menu.favorites');
  }
  if (path === VIRTUAL_PATH_RECENT) {
    return t('menu.history'); // Example
  }
  return path.replace(VIRTUAL_PATH_PREFIX, "");
}

export function convertFavoriteToEntry(fav: FavoriteEntry): EntryItem {
  return {
    path: fav.path,
    name: fav.path.split(/[\\/]/).pop() || fav.path,
    is_dir: true,
    thumbnail_path: null
  };
}
