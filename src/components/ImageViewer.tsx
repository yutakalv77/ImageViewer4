import { useEffect, useMemo } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { EntryItem } from "../types";

interface ImageViewerProps {
  images: EntryItem[];
  currentIndex: number;
  viewMode: "single" | "spread";
  readingDirection: "rtl" | "ltr";
  firstPageIsCover: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function ImageViewer({ 
  images, 
  currentIndex, 
  viewMode, 
  readingDirection, 
  firstPageIsCover, 
  onClose,
  onNavigate
}: ImageViewerProps) {

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isRtl = readingDirection === "rtl";
      
      // Map keys to actions based on reading direction
      const nextKey = isRtl ? "ArrowLeft" : "ArrowRight";
      const prevKey = isRtl ? "ArrowRight" : "ArrowLeft";

      if (e.key === nextKey) {
        if (viewMode === "single") {
          onNavigate(Math.min(currentIndex + 1, images.length - 1));
        } else {
          const step = (currentIndex === 0 && firstPageIsCover) ? 1 : 2;
          onNavigate(Math.min(currentIndex + step, images.length - 1));
        }
      } else if (e.key === prevKey) {
        if (viewMode === "single") {
          onNavigate(Math.max(currentIndex - 1, 0));
        } else {
          const prevIndex = firstPageIsCover 
            ? (currentIndex <= 2 ? 0 : currentIndex - 2)
            : Math.max(currentIndex - 2, 0);
          onNavigate(prevIndex);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, images.length, viewMode, firstPageIsCover, readingDirection, onNavigate]);

  // Determine which images to show in spread mode
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
          `見開き表示: ${currentIndex + 1}ページ付近`
        )}
      </div>
    </div>
  );
}
