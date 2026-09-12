import { useState, useCallback, useRef, useMemo } from "react";
import { NavigationType } from "../types";
import { normalizeSeparators, isVirtualPath } from "../utils/pathUtils";

export interface ScrollTarget {
  path: string;
  scrollTop: number;
  id: number;
}

/**
 * Normalizes a path string into a consistent key for scroll position caching.
 * - Handles Windows backslashes vs forward slashes
 * - Strips redundant trailing slashes (except root like "C:/" or "/")
 * - Normalizes casing for physical paths
 */
export function normalizePathKey(path: string): string {
  if (!path) return "";
  if (isVirtualPath(path)) return path;

  let normalized = normalizeSeparators(path);
  // Remove trailing slash unless it is the root ("/" or "C:/")
  if (normalized.length > 1 && normalized.endsWith("/") && !/^[A-Za-z]:\/$/.test(normalized)) {
    normalized = normalized.replace(/\/+$/, "");
  }
  return normalized.toLowerCase();
}

export function useScrollManager() {
  const scrollPositionsRef = useRef<Map<string, number>>(new Map());
  const [scrollTarget, setScrollTarget] = useState<ScrollTarget>({ path: "", scrollTop: 0, id: 0 });

  const getKey = useCallback((path: string) => {
    return normalizePathKey(path);
  }, []);

  const saveScrollPosition = useCallback((path: string, scrollTop: number) => {
    if (!path) return;
    scrollPositionsRef.current.set(getKey(path), scrollTop);
  }, [getKey]);

  const getSavedScrollPosition = useCallback((path: string) => {
    if (!path) return undefined;
    return scrollPositionsRef.current.get(getKey(path));
  }, [getKey]);

  const prepareScrollForNavigation = useCallback((
    targetPath: string,
    currentPath: string,
    navType: NavigationType = "open"
  ) => {
    if (!targetPath) return 0;
    const targetKey = getKey(targetPath);
    const currentKey = currentPath ? getKey(currentPath) : "";

    let nextScrollTop = 0;
    if (targetKey === currentKey) {
      // 同じパスへのリロード（リネーム等）：現在の位置を維持
      nextScrollTop = scrollPositionsRef.current.get(targetKey) ?? 0;
    } else if (navType === "open") {
      // フォルダを開いた際、スクロール位置は必ず先頭位置で表示
      nextScrollTop = 0;
      scrollPositionsRef.current.set(targetKey, 0);
    } else if (navType === "back" || navType === "forward") {
      // 履歴で戻った（進んだ）場合、記憶していたスクロール位置で表示
      nextScrollTop = scrollPositionsRef.current.get(targetKey) ?? 0;
    } else if (navType === "up") {
      // 親フォルダへ遷移した場合、記憶していたスクロール位置があればその位置、なければ先頭位置で表示
      nextScrollTop = scrollPositionsRef.current.get(targetKey) ?? 0;
    }

    setScrollTarget(prev => ({
      path: targetPath,
      scrollTop: nextScrollTop,
      id: prev.id + 1
    }));

    return nextScrollTop;
  }, [getKey]);

  return useMemo(() => ({
    scrollTarget,
    saveScrollPosition,
    getSavedScrollPosition,
    prepareScrollForNavigation
  }), [scrollTarget, saveScrollPosition, getSavedScrollPosition, prepareScrollForNavigation]);
}

