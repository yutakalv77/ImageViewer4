import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getNextIndex,
  getPrevIndex,
  getVisibleImages,
  formatViewerInfo,
  DEFAULT_PAGE_NUMBER_POSITION
} from "../utils/viewerUtils";
import { EntryItem, PageNumberPosition } from "../types";
import { ContextMenu } from "./ContextMenu";
import { ViewerImageItem } from "./ViewerImageItem";
import { RenameModal } from "./RenameModal";
import { isZipVirtualPath } from "../utils/pathUtils";
import { isTargetEditable } from "../utils/domUtils";
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
  pageNumberPosition?: PageNumberPosition;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onShowInfo: (path: string) => void;
  onManualInteraction: () => void;
  onRenameImage?: (oldPath: string, newName: string) => Promise<void>;
}

export function ImageViewer({ 
  isOpen,
  currentIndex,
  images,
  viewMode,
  readingDirection,
  firstPageIsCover,
  pageNumberPosition = DEFAULT_PAGE_NUMBER_POSITION,
  onClose,
  onNavigate,
  onShowInfo,
  onManualInteraction,
  onRenameImage
}: ImageViewerProps) {
  const { t } = useTranslation();
  const lastWheelTime = useRef(0);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [isRenameOpen, setIsRenameOpen] = useState(false);

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

  const currentItem = images && images.length > 0 && currentIndex >= 0
    ? images[Math.max(0, Math.min(currentIndex, images.length - 1))]
    : null;

  const canRename = !!onRenameImage && !!currentItem && !isZipVirtualPath(currentItem.path);

  useEffect(() => {
    if (!isOpen || isRenameOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTargetEditable(e.target)) return;

      const isRtl = readingDirection === "rtl";
      const nextKey = isRtl ? "ArrowLeft" : "ArrowRight";
      const prevKey = isRtl ? "ArrowRight" : "ArrowLeft";

      if (e.key === nextKey || e.key === " ") {
        e.preventDefault();
        handleNext();
      } else if (e.key === prevKey) {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "F2" && canRename) {
        e.preventDefault();
        setIsRenameOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isRenameOpen, handleNext, handlePrev, readingDirection, canRename]);

  const spreadImages = useMemo(() => {
    return getVisibleImages(images, currentIndex, {
      viewMode,
      firstPageIsCover,
      readingDirection,
    });
  }, [images, currentIndex, viewMode, firstPageIsCover, readingDirection]);

  if (!isOpen || !images || images.length === 0 || currentIndex < 0) return null;

  const menuItems = [
    ...(currentItem ? [
      { label: t('context_menu.show_info'), onClick: () => onShowInfo(currentItem.path) },
      ...(canRename ? [
        { 
          label: t('context_menu.rename', { defaultValue: '名前を変更' }), 
          shortcut: "F2", 
          onClick: () => setIsRenameOpen(true) 
        },
      ] : []),
      { separator: true }
    ] : []),
    { label: t('common.close'), onClick: onClose },
  ];


  return (
    <div 
      className={`viewer-overlay page-pos-${pageNumberPosition}`} 
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
            return (
              <ViewerImageItem
                key={`${img.path}-${idx}`}
                image={img}
                readingDirection={readingDirection}
                onNext={handleNext}
                onPrev={handlePrev}
              />
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

      
      {currentItem && pageNumberPosition !== "hidden" && (
        <div 
          className={`viewer-info pos-${pageNumberPosition}`} 
          onClick={(e) => e.stopPropagation()}
        >
          {formatViewerInfo(t, {
            viewMode,
            currentIndex,
            totalImages: images.length,
            currentImageName: currentItem.name,
          })}
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

      {currentItem && canRename && (
        <RenameModal
          isOpen={isRenameOpen}
          currentName={currentItem.name}
          onRename={async (newName) => {
            await onRenameImage(currentItem.path, newName);
          }}
          onClose={() => setIsRenameOpen(false)}
        />
      )}
    </div>

  );
}
