import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getNextIndex, getPrevIndex } from "../utils/viewerUtils";
import { EntryItem } from "../types";
import { ContextMenu } from "./ContextMenu";
import "./ImageViewer.css";

// Navigation Constants
const WHEEL_COOLDOWN = 400; // ms
const WHEEL_THRESHOLD = 30;

interface ImageViewerProps {
  isOpen: boolean;
  currentIndex: number;
  images: EntryItem[];
  viewMode: "single" | "spread";
  readingDirection: "rtl" | "ltr";
  firstPageIsCover: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onShowInfo: (path: string) => void;
  onManualInteraction: () => void;
}

export function ImageViewer({ 
  isOpen,
  currentIndex,
  images,
  viewMode,
  readingDirection,
  firstPageIsCover,
  onClose,
  onNavigate,
  onShowInfo,
  onManualInteraction
}: ImageViewerProps) {
  const { t } = useTranslation();
  const lastWheelTime = useRef(0);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

  const handleNext = useCallback(() => {
    onManualInteraction();
    onNavigate(getNextIndex(currentIndex, { viewMode, firstPageIsCover, totalImages: images.length }));
  }, [currentIndex, images.length, viewMode, firstPageIsCover, onNavigate, onManualInteraction]);

  const handlePrev = useCallback(() => {
    onManualInteraction();
    onNavigate(getPrevIndex(currentIndex, { viewMode, firstPageIsCover, totalImages: images.length }));
  }, [currentIndex, images.length, viewMode, firstPageIsCover, onNavigate, onManualInteraction]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheelTime.current < WHEEL_COOLDOWN) return;
    if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;

    if (e.deltaY > 0) {
      handleNext();
    } else {
      handlePrev();
    }
    lastWheelTime.current = now;
  }, [handleNext, handlePrev]);

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

  if (!isOpen || currentIndex < 0) return null;

  const menuItems = [
    { label: t('context_menu.show_info'), onClick: () => onShowInfo(images[currentIndex].path) },
    { separator: true },
    { label: t('common.close'), onClick: onClose },
  ];

  return (
    <div 
      className="viewer-overlay" 
      onClick={onClose}
      onWheel={handleWheel}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      <div className="direction-indicator" title={t('common.reading_direction')}>
        {readingDirection === "rtl" ? "⇦" : "⇨"}
      </div>
      <div className={`viewer-container ${viewMode === 'spread' ? 'spread-view' : ''}`}>
        {spreadImages.map((img, idx) => (
          img && (
            <img 
              key={`${img.path}-${idx}`}
              src={convertFileSrc(img.path)} 
              alt={img.name} 
              className="viewer-image"
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const isRtl = readingDirection === "rtl";
                
                if (x > rect.width / 2) {
                  // 右側クリック
                  isRtl ? handlePrev() : handleNext();
                } else {
                  // 左側クリック
                  isRtl ? handleNext() : handlePrev();
                }
              }}
            />
          )
        ))}
      </div>
      
      <div className="viewer-info" onClick={(e) => e.stopPropagation()}>
        {viewMode === "single" ? (
          t('slideshow.viewer_info_single', { page: currentIndex + 1, total: images.length, name: images[currentIndex].name })
        ) : (
          t('slideshow.viewer_info', { page: currentIndex + 1, total: images.length })
        )}
      </div>

      {contextMenu && (
        <ContextMenu 
          x={contextMenu.x} 
          y={contextMenu.y} 
          items={menuItems} 
          onClose={() => setContextMenu(null)} 
        />
      )}
    </div>
  );
}
