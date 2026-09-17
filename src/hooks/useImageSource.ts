import { useState, useEffect } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { isZipVirtualPath } from "../utils/pathUtils";

export interface UseImageSourceResult {
  src: string | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * 画像のファイルパスまたはZIP仮想パスから表示用URLを解決するカスタムフック
 * - 通常パス: convertFileSrc を使用
 * - ZIP仮想パス: バックエンドから画像バイナリを取得して Blob URL を生成し、破棄時に revokeObjectURL で解放
 */
export function useImageSource(path: string | null | undefined): UseImageSourceResult {
  const [src, setSrc] = useState<string | null>(() => {
    if (!path) return null;
    if (!isZipVirtualPath(path)) {
      return convertFileSrc(path);
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return !!path && isZipVirtualPath(path);
  });
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!path) {
      setSrc(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!isZipVirtualPath(path)) {
      setSrc(convertFileSrc(path));
      setIsLoading(false);
      setError(null);
      return;
    }

    let isCancelled = false;
    let createdUrl: string | null = null;

    setIsLoading(true);
    setError(null);

    invoke<{ data: number[]; mime: string }>("get_zip_image_data", { path })
      .then((result) => {
        if (isCancelled) return;
        const blob = new Blob([new Uint8Array(result.data)], { type: result.mime });
        createdUrl = URL.createObjectURL(blob);
        setSrc(createdUrl);
        setIsLoading(false);
      })
      .catch((err) => {
        if (isCancelled) return;
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [path]);

  return { src, isLoading, error };
}
