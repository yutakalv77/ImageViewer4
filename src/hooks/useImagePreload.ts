import { useEffect, useRef } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { EntryItem } from "../types";
import { isZipVirtualPath } from "../utils/pathUtils";

/**
 * プリロード対象の画像パス一覧を抽出する純粋関数
 */
export function getPreloadPaths(
  images: EntryItem[] | undefined,
  currentIndex: number,
  preloadCount: number = 2
): string[] {
  if (!images || images.length === 0 || currentIndex < 0) return [];
  const paths: string[] = [];
  const start = Math.max(0, currentIndex - preloadCount);
  const end = Math.min(images.length - 1, currentIndex + preloadCount);

  for (let i = start; i <= end; i++) {
    if (i !== currentIndex) {
      const item = images[i];
      if (item && !isZipVirtualPath(item.path)) {
        paths.push(item.path);
      }
    }
  }
  return paths;
}

/**
 * 現在表示中の画像の前後にある通常画像をバックグラウンドで事前読み込み（プリロード）し、
 * キーボードやホイールによる切り替え時の描画レスポンスを最大化するカスタムフック
 */
export function useImagePreload(
  images: EntryItem[] | undefined,
  currentIndex: number,
  isOpen: boolean = true,
  preloadCount: number = 2
): void {
  const preloadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // アンマウント時にキャッシュ参照を解放
  useEffect(() => {
    return () => {
      preloadedImagesRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      preloadedImagesRef.current.clear();
      return;
    }

    if (!images || images.length === 0 || currentIndex < 0) {
      return;
    }

    const pathsToPreload = getPreloadPaths(images, currentIndex, preloadCount);
    const currentMap = preloadedImagesRef.current;

    for (const path of pathsToPreload) {
      if (!currentMap.has(path)) {
        const img = new Image();
        img.src = convertFileSrc(path);
        currentMap.set(path, img);
      }
    }

    // キャッシュサイズが肥大化しないよう古いキャッシュを適宜クリーンアップ（上限20枚）
    if (currentMap.size > 20) {
      const activePathSet = new Set(pathsToPreload);
      for (const [key] of currentMap) {
        if (!activePathSet.has(key)) {
          currentMap.delete(key);
          if (currentMap.size <= 10) break;
        }
      }
    }
  }, [images, currentIndex, isOpen, preloadCount]);
}
