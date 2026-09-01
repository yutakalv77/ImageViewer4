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
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Auto-close viewer if images array becomes empty while open
  useEffect(() => {
    if (isOpen && (!images || images.length === 0)) {
      onClose();
    }
  }, [isOpen, images, onClose]);

  // Clamp currentIndex if out of bounds
  useEffect(() => {
    if (isOpen && images && images.length > 0) {
      if (currentIndex >= images.length) {
        onNavigate(images.length - 1);
      } else if (currentIndex < 0) {
        onNavigate(0);
      }
    }
  }, [isOpen, images, currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (!images || images.length === 0) return;
    onManualInteraction();
    onNavigate(getNextIndex(currentIndex, { viewMode, firstPageIsCover, totalImages: images.length }));
  }, [currentIndex, images, viewMode, firstPageIsCover, onNavigate, onManualInteraction]);

  const handlePrev = useCallback(() => {
    if (!images || images.length === 0) return;
    onManualInteraction();
    onNavigate(getPrevIndex(currentIndex, { viewMode, firstPageIsCover, totalImages: images.length }));
  }, [currentIndex, images, viewMode, firstPageIsCover, onNavigate, onManualInteraction]);

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
    if (!isOpen) return;

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
  }, [isOpen, handleNext, handlePrev, readingDirection]);

  const spreadImages = useMemo(() => {
    if (!images || images.length === 0) return [];
    const safeIndex = Math.max(0, Math.min(currentIndex, images.length - 1));

    if (viewMode === "single") {
      const img = images[safeIndex];
      return img ? [img] : [];
    }

    if (firstPageIsCover && safeIndex === 0) {
      const img = images[0];
      return img ? [img] : [];
    }

    let pairStart = safeIndex;
    if (firstPageIsCover) {
      if (pairStart % 2 === 0) pairStart -= 1;
      pairStart = Math.max(1, pairStart);
    } else {
      if (pairStart % 2 !== 0) pairStart -= 1;
      pairStart = Math.max(0, pairStart);
    }

    const pair: EntryItem[] = [];
    if (images[pairStart]) {
      pair.push(images[pairStart]);
    }
    if (pairStart + 1 < images.length && images[pairStart + 1]) {
      pair.push(images[pairStart + 1]);
    }

    if (pair.length === 0 && images[safeIndex]) {
      pair.push(images[safeIndex]);
    }

    if (readingDirection === "rtl") {
      return [...pair].reverse();
    }
    return pair;
  }, [images, currentIndex, viewMode, firstPageIsCover, readingDirection]);

  if (!isOpen || !images || images.length === 0 || currentIndex < 0) return null;

  const currentItem = images[Math.max(0, Math.min(currentIndex, images.length - 1))];

  const handleImageError = (path: string) => {
    setFailedImages(prev => ({ ...prev, [path]: true }));
  };

  const handleRetryImage = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    setFailedImages(prev => {
      const next = { ...prev };
      delete next[path];
      return next;
    });
  };

  const menuItems = [
    ...(currentItem ? [
      { label: t('context_menu.show_info'), onClick: () => onShowInfo(currentItem.path) },
      { separator: true }
    ] : []),
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
        {spreadImages.length > 0 ? (
          spreadImages.map((img, idx) => {
            if (!img) return null;
            const isFailed = !!failedImages[img.path];

            return (
              <div key={`${img.path}-${idx}`} className="viewer-image-wrapper">
                {isFailed ? (
                  <div className="viewer-image-error" onClick={(e) => e.stopPropagation()}>
                    <div className="error-icon">⚠️</div>
                    <div className="error-filename">{img.name}</div>
                    <div className="error-text">画像を読み込めませんでした</div>
                    <button className="error-retry-btn" onClick={(e) => handleRetryImage(e, img.path)}>
                      再試行
                    </button>
                  </div>
                ) : (
                  <img 
                    src={convertFileSrc(img.path)} 
                    alt={img.name} 
                    className="viewer-image"
                    onError={() => handleImageError(img.path)}
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const isRtl = readingDirection === "rtl";
                      
                      if (x > rect.width / 2) {
                        // Right side click
                        isRtl ? handlePrev() : handleNext();
                      } else {
                        // Left side click
                        isRtl ? handleNext() : handlePrev();
                      }
                    }}
                  />
                )}
              </div>
            );
          })
        ) : (
          <div className="viewer-image-error" onClick={(e) => e.stopPropagation()}>
            <div className="error-icon">🖼️</div>
            <div className="error-text">表示できる画像がありません</div>
            <button className="error-retry-btn" onClick={onClose}>
              {t('common.close')}
            </button>
          </div>
        )}
      </div>
      
      {currentItem && (
        <div className="viewer-info" onClick={(e) => e.stopPropagation()}>
          {viewMode === "single" ? (
            t('slideshow.viewer_info_single', { 
              page: currentIndex + 1, 
              total: images.length, 
              name: currentItem.name 
            })
          ) : (
            t('slideshow.viewer_info', { 
              page: Math.min(currentIndex + 1, images.length), 
              total: images.length 
            })
          )}
        </div>
      )}

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
