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
import { MagnifierLens } from "./MagnifierLens";
import { useMagnifier } from "../hooks/useMagnifier";
import { useZoomPan } from "../hooks/useZoomPan";
import { useBadgeFade } from "../hooks/useBadgeFade";
import { formatZoomPercent } from "../utils/zoomPanUtils";
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
  const overlayRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [isRenameOpen, setIsRenameOpen] = useState(false);

  const magnifier = useMagnifier(overlayRef, currentIndex);
  const zoomPan = useZoomPan({
    containerRef: overlayRef,
    activeKey: currentIndex,
    enabled: !magnifier.isMagnifierActive,
  });

  const badgeFade = useBadgeFade({
    triggerKey: `${zoomPan.scale}-${zoomPan.offset.x}-${zoomPan.offset.y}`,
    enabled: zoomPan.isZoomed && !magnifier.isMagnifierActive,
    activeDurationMs: 2000,
    fadeDurationMs: 2000,
  });

  // Auto-close magnifier when viewer closes
  useEffect(() => {
    if (!isOpen) {
      magnifier.setMagnifierActive(false);
    }
  }, [isOpen, magnifier]);

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

  const handleCombinedWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (magnifier.handleWheel(e)) return;
    if (zoomPan.handleWheel(e)) return;
    handleWheel(e);
  }, [magnifier, zoomPan, handleWheel]);

  const handleCombinedMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    magnifier.handleMouseMove(e);
    zoomPan.handleMouseMove(e);
  }, [magnifier, zoomPan]);

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
      } else if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        magnifier.toggleMagnifier();
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        if (magnifier.isMagnifierActive) {
          magnifier.setMagnifierActive(false);
        } else if (zoomPan.isZoomed) {
          zoomPan.resetZoom();
        } else {
          onClose();
        }
      } else if (magnifier.isMagnifierActive) {
        const isNumpadAdd = e.code === "NumpadAdd";
        const isNumpadSubtract = e.code === "NumpadSubtract";
        const isMinusKey = e.code === "Minus" || e.key === "-";
        const isPlusKey = e.key === "+" || (!e.shiftKey && e.key === "=");

        if (e.ctrlKey) {
          if (isPlusKey || isNumpadAdd) {
            e.preventDefault();
            magnifier.zoomIn();
          } else if (isMinusKey || isNumpadSubtract) {
            e.preventDefault();
            magnifier.zoomOut();
          }
        } else if (e.shiftKey) {
          if (isNumpadAdd || e.code === "Equal" || e.key === "*" || e.code === "BracketRight") {
            e.preventDefault();
            magnifier.increaseLensSize();
          } else if (isMinusKey || isNumpadSubtract || e.key === "_" || (e.code === "Minus" && e.key === "=")) {
            e.preventDefault();
            magnifier.decreaseLensSize();
          } else if (isPlusKey) {
            e.preventDefault();
            magnifier.zoomIn();
          }
        } else {
          if (isPlusKey || isNumpadAdd) {
            e.preventDefault();
            magnifier.zoomIn();
          } else if (isMinusKey || isNumpadSubtract) {
            e.preventDefault();
            magnifier.zoomOut();
          }
        }
      } else {
        // Zoom & Pan shortcuts when magnifier is not active
        if (e.key === "0" || (e.ctrlKey && e.key === "0")) {
          e.preventDefault();
          zoomPan.resetZoom();
        } else if (e.key === "1" || (e.ctrlKey && e.key === "1")) {
          e.preventDefault();
          zoomPan.setActualSize();
        } else if (e.key === "+" || (!e.shiftKey && e.key === "=") || e.code === "NumpadAdd") {
          e.preventDefault();
          zoomPan.zoomIn();
        } else if (e.key === "-" || e.code === "NumpadSubtract") {
          e.preventDefault();
          zoomPan.zoomOut();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isRenameOpen, handleNext, handlePrev, readingDirection, canRename, magnifier, zoomPan, onClose]);

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
      { 
        label: t('context_menu.magnifier', { defaultValue: '拡大鏡' }), 
        shortcut: "Z", 
        onClick: () => magnifier.toggleMagnifier() 
      },
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
      ref={overlayRef}
      className={`viewer-overlay page-pos-${pageNumberPosition} ${magnifier.isMagnifierActive ? 'magnifier-mode' : ''} ${zoomPan.isZoomed ? 'is-zoomed' : ''} ${zoomPan.isDragging ? 'is-dragging' : ''}`} 
      onClick={() => {
        if (magnifier.isMagnifierActive) return;
        if (zoomPan.hasDragged) {
          zoomPan.clearHasDragged();
          return;
        }
        if (zoomPan.isZoomed) {
          return;
        }
        onClose();
      }}
      onMouseDown={zoomPan.handleMouseDown}
      onMouseMove={handleCombinedMouseMove}
      onMouseUp={zoomPan.handleMouseUp}
      onDoubleClick={zoomPan.handleDoubleClick}
      onWheel={handleCombinedWheel}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      <div className="direction-indicator" title={t('common.reading_direction')}>
        {readingDirection === "rtl" ? "⇦" : "⇨"}
      </div>

      {badgeFade.isVisible && (
        <div
          className={`viewer-zoom-badge fade-${badgeFade.fadeState}`}
          data-testid="viewer-zoom-badge"
          onMouseEnter={badgeFade.handleMouseEnter}
          onMouseLeave={badgeFade.handleMouseLeave}
          onClick={(e) => {
            e.stopPropagation();
            zoomPan.resetZoom();
          }}
          title={t("viewer.zoom_reset", { defaultValue: "クリックでリセット" })}
        >
          <span className="viewer-zoom-badge-text">{formatZoomPercent(zoomPan.scale)}</span>
          <span className="viewer-zoom-badge-reset">✕</span>
        </div>
      )}
      
      <div className={`viewer-container ${viewMode === 'spread' ? 'spread-view' : ''}`}>
        <div
          className={`viewer-zoom-layer ${zoomPan.isDragging ? "is-dragging" : ""}`}
          style={{
            transform: `translate(${zoomPan.offset.x}px, ${zoomPan.offset.y}px) scale(${zoomPan.scale})`,
          }}
        >
          {spreadImages.length > 0 ? (
            spreadImages.map((img, idx) => {
              if (!img) return null;
              return (
                <ViewerImageItem
                  key={`${img.path}-${idx}`}
                  image={img}
                  readingDirection={readingDirection}
                  isMagnifierActive={magnifier.isMagnifierActive}
                  isZoomed={zoomPan.isZoomed}
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

      <MagnifierLens
        isActive={magnifier.isMagnifierActive}
        zoom={magnifier.zoom}
        lensSize={magnifier.lensSize}
        cursorPos={magnifier.cursorPos}
        imageSrc={magnifier.activeImageSrc}
        imageRect={magnifier.activeImageRect}
        containerRect={magnifier.containerRect}
      />
    </div>

  );
}
