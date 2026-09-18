import { useState, useEffect, useCallback, useRef } from "react";
import { EntryItem } from "../types";
import { useImageSource } from "../hooks/useImageSource";
import {
  ImageTransform,
  buildTransformStyle,
  calculateRotatedFitScale,
} from "../utils/transformUtils";
import { DOUBLE_CLICK_DELAY_MS } from "../utils/zoomPanUtils";

interface ViewerImageItemProps {
  image: EntryItem;
  readingDirection: "rtl" | "ltr";
  isMagnifierActive?: boolean;
  isZoomed?: boolean;
  transform?: ImageTransform;
  onNext: () => void;
  onPrev: () => void;
  onDoubleClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
}

/**
 * ビューワー内の1枚の画像を表示するコンポーネント
 * 通常パスおよびZIP内画像（Blob URL）の表示・クリック送り・エラーハンドリングを担当
 */
export function ViewerImageItem({
  image,
  readingDirection,
  isMagnifierActive = false,
  isZoomed = false,
  transform,
  onNext,
  onPrev,
  onDoubleClick,
}: ViewerImageItemProps) {
  const { src, isLoading, error } = useImageSource(image.path);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 画像パスが変わったら失敗フラグと保留中のクリックタイマーをリセット
  useEffect(() => {
    setLoadFailed(false);
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
  }, [image.path]);

  // コンポーネント破棄時にタイマーをクリーンアップ
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  const updateFitScale = useCallback(() => {
    if (!transform || (transform.rotation !== 90 && transform.rotation !== 270)) {
      setFitScale(1);
      return;
    }
    const wrapper = wrapperRef.current;
    const img = imgRef.current;
    if (!wrapper || !img) return;

    const natW = img.naturalWidth || img.clientWidth;
    const natH = img.naturalHeight || img.clientHeight;
    const scale = calculateRotatedFitScale(
      wrapper.clientWidth,
      wrapper.clientHeight,
      natW,
      natH,
      transform.rotation
    );
    setFitScale(scale);
  }, [transform]);

  useEffect(() => {
    updateFitScale();
  }, [updateFitScale, src]);

  useEffect(() => {
    window.addEventListener("resize", updateFitScale);
    return () => window.removeEventListener("resize", updateFitScale);
  }, [updateFitScale]);

  const hasError = !!error || loadFailed;

  const handleRetry = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadFailed(false);
    setRetryCount((c) => c + 1);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      e.stopPropagation();
      if (isMagnifierActive || isZoomed) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const isRtl = readingDirection === "rtl";
      const isRight = x > rect.width / 2;

      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }

      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        if (isRight) {
          isRtl ? onPrev() : onNext();
        } else {
          isRtl ? onNext() : onPrev();
        }
      }, DOUBLE_CLICK_DELAY_MS);
    },
    [isMagnifierActive, isZoomed, readingDirection, onNext, onPrev]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      e.stopPropagation();
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      onDoubleClick?.(e);
    },
    [onDoubleClick]
  );

  const transformStyle = transform
    ? buildTransformStyle(transform, fitScale)
    : "none";

  return (
    <div ref={wrapperRef} className="viewer-image-wrapper">
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
          ref={imgRef}
          key={`${image.path}-${retryCount}`}
          src={src}
          alt={image.name}
          className={`viewer-image ${isLoading ? "is-loading" : ""}`}
          style={{ transform: transformStyle }}
          onLoad={updateFitScale}
          onError={() => setLoadFailed(true)}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        />
      ) : null}
    </div>
  );
}
