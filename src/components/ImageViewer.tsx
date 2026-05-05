import { useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { convertFileSrc } from "@tauri-apps/api/core";
import { EntryItem } from "../types";
import { getNextIndex, getPrevIndex } from "../utils/viewerUtils";

interface ImageViewerProps {
  images: EntryItem[];
  currentIndex: number;
  viewMode: "single" | "spread";
  readingDirection: "rtl" | "ltr";
  firstPageIsCover: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onManualInteraction: () => void;
}

export function ImageViewer({ 
  images, 
  currentIndex, 
  viewMode, 
  readingDirection, 
  firstPageIsCover, 
  onClose,
  onNavigate,
  onManualInteraction
}: ImageViewerProps) {
  const { t } = useTranslation();

  const handleNext = useCallback(() => {
    onManualInteraction();
    onNavigate(getNextIndex(currentIndex, { viewMode, firstPageIsCover, totalImages: images.length }));
  }, [currentIndex, images.length, viewMode, firstPageIsCover, onNavigate, onManualInteraction]);

  const handlePrev = useCallback(() => {
    onManualInteraction();
    onNavigate(getPrevIndex(currentIndex, { viewMode, firstPageIsCover, totalImages: images.length }));
  }, [currentIndex, images.length, viewMode, firstPageIsCover, onNavigate, onManualInteraction]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isRtl = readingDirection === "rtl";
      const nextKey = isRtl ? "ArrowLeft" : "ArrowRight";
      const prevKey = isRtl ? "ArrowRight" : "ArrowLeft";

      if (e.key === nextKey || e.key === " ") {
        e.preventDefault();
        handleNext();
      } else if (e.key === prevKey) {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, readingDirection]);

  const spreadImages = useMemo(() => {
    if (viewMode === "single" || currentIndex < 0) return [images[currentIndex]];

    if (firstPageIsCover && currentIndex === 0) {
      return [images[0]];
    }

    let pairStart = currentIndex;
    if (firstPageIsCover) {
      if (pairStart % 2 === 0) pairStart -= 1;
    } else {
      if (pairStart % 2 !== 0) pairStart -= 1;
    }

    const pair = [images[pairStart]];
    if (pairStart + 1 < images.length) {
      pair.push(images[pairStart + 1]);
    }

    if (readingDirection === "rtl") {
      return [...pair].reverse();
    }
    return pair;
  }, [images, currentIndex, viewMode, firstPageIsCover, readingDirection]);

  if (currentIndex < 0) return null;

  return (
    <div className="viewer-overlay" onClick={onClose}>
      {viewMode === "spread" && (
        <div className="direction-indicator" title="読み方向">
          {readingDirection === "rtl" ? "⇦" : "⇨"}
        </div>
      )}
      <div className={`viewer-container ${viewMode === 'spread' ? 'spread-view' : ''}`}>
        {spreadImages.map((img, idx) => (
          img && (
            <img 
              key={`${img.path}-${idx}`}
              src={convertFileSrc(img.path)} 
              alt={img.name} 
              className="viewer-image"
              onClick={(e) => e.stopPropagation()}
            />
          )
        ))}
      </div>
      
      <div className="viewer-info" onClick={(e) => e.stopPropagation()}>
        {viewMode === "single" ? (
          `${currentIndex + 1} / ${images.length} - ${images[currentIndex].name}`
        ) : (
          t('slideshow.viewer_info', { page: currentIndex + 1, total: images.length })
        )}
      </div>
    </div>
  );
}
