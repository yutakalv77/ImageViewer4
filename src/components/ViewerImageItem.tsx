import { useState, useEffect, useCallback } from "react";
import { EntryItem } from "../types";
import { useImageSource } from "../hooks/useImageSource";

interface ViewerImageItemProps {
  image: EntryItem;
  readingDirection: "rtl" | "ltr";
  onNext: () => void;
  onPrev: () => void;
}

/**
 * ビューワー内の1枚の画像を表示するコンポーネント
 * 通常パスおよびZIP内画像（Blob URL）の表示・クリック送り・エラーハンドリングを担当
 */
export function ViewerImageItem({
  image,
  readingDirection,
  onNext,
  onPrev,
}: ViewerImageItemProps) {
  const { src, isLoading, error } = useImageSource(image.path);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // 画像パスが変わったら失敗フラグをリセット
  useEffect(() => {
    setLoadFailed(false);
  }, [image.path]);

  const hasError = !!error || loadFailed;

  const handleRetry = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadFailed(false);
    setRetryCount((c) => c + 1);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const isRtl = readingDirection === "rtl";

      if (x > rect.width / 2) {
        // 右側クリック
        isRtl ? onPrev() : onNext();
      } else {
        // 左側クリック
        isRtl ? onNext() : onPrev();
      }
    },
    [readingDirection, onNext, onPrev]
  );

  return (
    <div className="viewer-image-wrapper">
      {hasError ? (
        <div className="viewer-image-error" onClick={(e) => e.stopPropagation()}>
          <div className="error-icon">⚠️</div>
          <div className="error-filename">{image.name}</div>
          <div className="error-text">画像を読み込めませんでした</div>
          <button className="error-retry-btn" onClick={handleRetry}>
            再試行
          </button>
        </div>
      ) : src ? (
        <img
          key={`${image.path}-${retryCount}`}
          src={src}
          alt={image.name}
          className={`viewer-image ${isLoading ? "is-loading" : ""}`}
          onError={() => setLoadFailed(true)}
          onClick={handleClick}
        />
      ) : null}
    </div>
  );
}
