import { FavoriteEntry, EntryItem } from "../types";

/**
 * Utility for handling paths (both physical and virtual)
 */

export const VIRTUAL_PATH_PREFIX = "virtual:";
export const VIRTUAL_PATH_FAVORITES = "virtual:favorites";
export const VIRTUAL_PATH_RECENT = "virtual:recent";
export const VIRTUAL_PATH_SEARCH_PREFIX = "virtual:search?q=";
export const VIRTUAL_PATH_EVERYTHING_PREFIX = "virtual:everything?q=";

export function isVirtualPath(path: string | null | undefined): boolean {
  return !!path && path.startsWith(VIRTUAL_PATH_PREFIX);
}

export function isSearchPath(path: string | null | undefined): boolean {
  return !!path && (path.startsWith(VIRTUAL_PATH_SEARCH_PREFIX) || path.startsWith(VIRTUAL_PATH_EVERYTHING_PREFIX));
}

export function isEverythingSearchPath(path: string | null | undefined): boolean {
  return !!path && path.startsWith(VIRTUAL_PATH_EVERYTHING_PREFIX);
}

export function getSearchQuery(path: string): string {
  if (path.startsWith(VIRTUAL_PATH_EVERYTHING_PREFIX)) {
    return path.replace(VIRTUAL_PATH_EVERYTHING_PREFIX, "");
  }
  return path.replace(VIRTUAL_PATH_SEARCH_PREFIX, "");
}

export function getVirtualPathLabel(path: string, t: (key: string) => string): string {
  if (path === VIRTUAL_PATH_FAVORITES) {
    return "★ " + t('menu.favorites');
  }
  if (path === VIRTUAL_PATH_RECENT) {
    return t('menu.history');
  }
  if (isSearchPath(path)) {
    const prefix = isEverythingSearchPath(path) ? "🚀 " : "🔍 ";
    return `${prefix}"${getSearchQuery(path)}"`;
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

/**
 * Physical path utilities
 */

export function normalizeSeparators(path: string): string {
  return path.replace(/\\/g, '/');
}

export function getParentPath(path: string): string | null {
  if (!path || isVirtualPath(path)) return null;
  
  // Remove trailing slash
  const p = path.replace(/[\\/]$/, "");
  const lastSlash = Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\"));
  
  if (lastSlash === -1) {
    if (p.endsWith(":")) {
      const root = p + (path.includes("/") ? "/" : "\\");
      return root !== path ? root : null;
    }
    return null;
  }

  let parent = p.substring(0, lastSlash);
  
  if (parent === "") {
    if (lastSlash === 0) {
      return path.startsWith("/") ? "/" : path.startsWith("\\") ? "\\" : null;
    }
  } else if (parent.endsWith(":")) {
    parent += path.includes("/") ? "/" : "\\";
  }

  return parent !== path ? parent : null;
}

export function getPathParts(path: string): string[] {
  if (isVirtualPath(path)) return [path];
  const separator = path.includes("\\") ? "\\" : "/";
  return path.split(separator).filter(p => p !== "");
}
