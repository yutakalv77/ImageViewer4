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

export const ZIP_PATH_SEPARATOR = "::";

/**
 * パスがZIP/CBZアーカイブファイル（.zip, .cbz）かどうかを判定
 */
export function isZipFile(path: string | null | undefined): boolean {
  if (!path) return false;
  const cleanPath = path.split(ZIP_PATH_SEPARATOR)[0].split("?")[0];
  const dotIndex = cleanPath.lastIndexOf(".");
  if (dotIndex === -1) return false;
  const ext = cleanPath.slice(dotIndex).toLowerCase();
  return ext === ".zip" || ext === ".cbz";
}


/**
 * パスがZIP内の仮想パス（"archive.zip::inner/path.jpg"）かどうかを判定
 */
export function isZipVirtualPath(path: string | null | undefined): boolean {
  return !!path && path.includes(ZIP_PATH_SEPARATOR);
}

/**
 * パスがZIPファイル自体またはZIP内部の仮想パスかどうかを判定
 */
export function isZipPath(path: string | null | undefined): boolean {
  return isZipVirtualPath(path) || isZipFile(path);
}

/**
 * ZIP仮想パスを外部ZIPファイルパスと内部エントリパスに分解
 */
export function parseZipPath(path: string): { zipPath: string; innerPath: string } {
  if (!path) return { zipPath: "", innerPath: "" };
  const idx = path.indexOf(ZIP_PATH_SEPARATOR);
  if (idx === -1) {
    return { zipPath: path, innerPath: "" };
  }
  return {
    zipPath: path.substring(0, idx),
    innerPath: path.substring(idx + ZIP_PATH_SEPARATOR.length).replace(/\\/g, '/').replace(/^\/+/, '')
  };
}

/**
 * 外部ZIPファイルパスと内部エントリパスからZIP仮想パスを生成
 */
export function makeZipPath(zipPath: string, innerPath: string): string {
  const cleanInner = innerPath.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
  if (!cleanInner) {
    return zipPath;
  }
  return `${zipPath}${ZIP_PATH_SEPARATOR}${cleanInner}`;
}

export function normalizeSeparators(path: string): string {
  return path.replace(/\\/g, '/');
}

export function getParentPath(path: string): string | null {
  if (!path || isVirtualPath(path)) return null;
  
  // 1. ZIP仮想パス（zipPath::innerPath）の場合
  if (isZipVirtualPath(path)) {
    const { zipPath, innerPath } = parseZipPath(path);
    const cleanInner = innerPath.replace(/\/+$/, "");
    if (!cleanInner) {
      return getParentPath(zipPath);
    }
    const lastSlash = cleanInner.lastIndexOf("/");
    if (lastSlash === -1) {
      return zipPath;
    }
    const parentInner = cleanInner.substring(0, lastSlash);
    return makeZipPath(zipPath, parentInner);
  }

  // 2. 通常のパス（ZIPファイル本体を含む）
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

/**
 * Checks if parentPath is the direct parent of childPath.
 * Takes path separators, casing, and ZIP virtual paths into account.
 */
export function isParentOf(
  parentPath: string | null | undefined,
  childPath: string | null | undefined
): boolean {
  if (!parentPath || !childPath) return false;
  const expectedParent = getParentPath(childPath);
  if (!expectedParent) return false;

  const normExpected = normalizeSeparators(expectedParent).toLowerCase().replace(/\/+$/, "");
  const normParent = normalizeSeparators(parentPath).toLowerCase().replace(/\/+$/, "");

  // ドライブレター直下（例: "c:" と "c:/"）の統一
  const cleanExpected = /^[a-z]:$/i.test(normExpected) ? `${normExpected}/` : normExpected;
  const cleanParent = /^[a-z]:$/i.test(normParent) ? `${normParent}/` : normParent;

  return cleanExpected === cleanParent;
}

/**
 * Finds the index of an entry in entries matching targetPath.
 * Normalizes separators, trailing slashes, and casing.
 */
export function findEntryIndexByPath(
  entries: EntryItem[] | undefined | null,
  targetPath: string | null | undefined
): number {
  if (!entries || entries.length === 0 || !targetPath) return -1;
  const normTarget = normalizeSeparators(targetPath).toLowerCase().replace(/\/+$/, "");

  return entries.findIndex((entry) => {
    const normEntry = normalizeSeparators(entry.path).toLowerCase().replace(/\/+$/, "");
    return normEntry === normTarget;
  });
}

export function getPathParts(path: string): string[] {
  if (isVirtualPath(path)) return [path];
  const separator = path.includes("\\") ? "\\" : "/";
  return path.split(separator).filter(p => p !== "");
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

/**
 * 現在のパスからパンくずリスト（階層一覧）を生成する
 */
export function getBreadcrumbs(
  currentPath: string | null | undefined,
  t: (key: string) => string
): BreadcrumbItem[] {
  if (!currentPath) return [];

  if (isVirtualPath(currentPath)) {
    return [{ name: getVirtualPathLabel(currentPath, t), path: currentPath }];
  }

  // ZIP仮想パスの場合
  if (isZipVirtualPath(currentPath)) {
    const { zipPath, innerPath } = parseZipPath(currentPath);
    const baseCrumbs = getBreadcrumbs(zipPath, t);
    
    const innerParts = innerPath.split("/").filter(p => p !== "");
    let accumulatedInner = "";
    for (const part of innerParts) {
      accumulatedInner = accumulatedInner ? `${accumulatedInner}/${part}` : part;
      baseCrumbs.push({
        name: part,
        path: makeZipPath(zipPath, accumulatedInner)
      });
    }
    return baseCrumbs;
  }

  const separator = currentPath.includes("\\") ? "\\" : "/";
  const isWindows = currentPath.includes("\\") || /^[A-Z]:/i.test(currentPath);

  const parts = currentPath.split(separator).filter(p => p !== "");
  const crumbs: BreadcrumbItem[] = [];

  if (isWindows) {
    let accumulatedPath = "";
    for (let i = 0; i < parts.length; i++) {
      accumulatedPath += (i === 0 ? "" : separator) + parts[i];
      crumbs.push({
        name: parts[i],
        path: accumulatedPath + (i === 0 ? separator : "")
      });
    }
  } else {
    // macOS / Linux
    let accumulatedPath = "";
    crumbs.push({ name: "/", path: "/" });
    for (let i = 0; i < parts.length; i++) {
      accumulatedPath += (accumulatedPath === "/" ? "" : "/") + parts[i];
      crumbs.push({
        name: parts[i],
        path: accumulatedPath
      });
    }
  }

  return crumbs;
}

