import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getNextIndex,
  getPrevIndex,
  getVisibleImages,
  formatViewerInfo,
  getPostDeleteNavigation,
  DEFAULT_PAGE_NUMBER_POSITION,
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
import { getTransformBadgeText } from "../utils/transformUtils";
import { useOptionalUIContext } from "../context/UIContext";
import { useImageTransform } from "../hooks/useImageTransform";
import { isZipVirtualPath } from "../utils/pathUtils";
import { createViewerContextMenuItems } from "../utils/viewerContextMenu";
import { useViewerShortcuts } from "../hooks/useViewerShortcuts";
import { useViewerOverlayEvents } from "../hooks/useViewerOverlayEvents";
import { useImagePreload } from "../hooks/useImagePreload";
import "./ImageViewer.css";

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
  onDeleteImage?: (path: string) => Promise<boolean>;
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
  onRenameImage,
  onDeleteImage,
}: ImageViewerProps) {
  const { t } = useTranslation();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isRenameOpen, setIsRenameOpen] = useState(false);

  const context = useOptionalUIContext();
  const localTransform = useImageTransform();

  const {
    imageTransform,
    isTransformed,
    transformCount,
    rotateClockwise,
    rotateCounterClockwise,
    toggleFlipH,
    toggleFlipV,
    resetTransform,
  } = context ?? {
    imageTransform: localTransform.transform,
    isTransformed: localTransform.isTransformed,
    transformCount: localTransform.transformCount,
    rotateClockwise: localTransform.rotateClockwise,
    rotateCounterClockwise: localTransform.rotateCounterClockwise,
    toggleFlipH: localTransform.toggleFlipH,
    toggleFlipV: localTransform.toggleFlipV,
    resetTransform: localTransform.resetTransform,
  };

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

  const transformBadgeFade = useBadgeFade({
    triggerKey: transformCount,
    enabled: isTransformed && !magnifier.isMagnifierActive,
    activeDurationMs: 2000,
    fadeDurationMs: 2000,
  });

  // Preload adjacent images in background to maximize wheel/keyboard flip rendering speed
  useImagePreload(images, currentIndex, isOpen);

  // Reset transform on image page change or when viewer closes
  useEffect(() => {
    resetTransform();
  }, [currentIndex, resetTransform]);

  useEffect(() => {
    if (!isOpen) {
      resetTransform();
    }
  }, [isOpen, resetTransform]);

  // Register zoom controls to UIContext
  useEffect(() => {
    if (context?.registerZoomControls && isOpen) {
      context.registerZoomControls({
        zoomActualSize: zoomPan.toggleActualSize,
        zoomFit: zoomPan.resetZoom,
        isZoomed: zoomPan.isZoomed,
      });
      return () => {
        context.registerZoomControls(null);
      };
    }
  }, [context, isOpen, zoomPan.toggleActualSize, zoomPan.resetZoom, zoomPan.isZoomed]);

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

  const currentItem = images && images.length > 0 && currentIndex >= 0
    ? images[Math.max(0, Math.min(currentIndex, images.length - 1))]
    : null;

  const canRename = !!onRenameImage && !!currentItem && !isZipVirtualPath(currentItem.path);
  const canDelete = !!onDeleteImage && !!currentItem && !isZipVirtualPath(currentItem.path);

  const handleDelete = useCallback(async () => {
    if (!canDelete || !currentItem || !onDeleteImage) return;
    setContextMenu(null);
    const pathToDelete = currentItem.path;
    const currentTotal = images.length;
    const currentIdx = currentIndex;

    const success = await onDeleteImage(pathToDelete);
    if (!success) return;

    resetTransform();
    zoomPan.resetZoom();

    const navResult = getPostDeleteNavigation(currentIdx, currentTotal);
    if (navResult.shouldClose) {
      onClose();
    } else {
      onNavigate(navResult.nextIndex);
    }
  }, [canDelete, currentItem, onDeleteImage, images.length, currentIndex, onClose, onNavigate, resetTransform, zoomPan]);

  // Register keyboard shortcuts
  useViewerShortcuts({
    isOpen,
    isRenameOpen,
    readingDirection,
    canRename,
    canDelete,
    actions: {
      handleNext,
      handlePrev,
      onOpenRename: () => setIsRenameOpen(true),
      onDelete: handleDelete,
      onClose,
      magnifier,
      zoomPan,
      transform: {
        isTransformed,
        resetTransform,
        rotateClockwise,
        rotateCounterClockwise,
        toggleFlipH,
        toggleFlipV,
      },
    },
  });

  // Manage overlay mouse and wheel events
  const overlayEvents = useViewerOverlayEvents({
    isMagnifierActive: magnifier.isMagnifierActive,
    isZoomed: zoomPan.isZoomed,
    hasDragged: zoomPan.hasDragged,
    clearHasDragged: zoomPan.clearHasDragged,
    onClose,
    onNext: handleNext,
    onPrev: handlePrev,
    magnifier,
    zoomPan,
  });

  const spreadImages = useMemo(() => {
    return getVisibleImages(images, currentIndex, {
      viewMode,
      firstPageIsCover,
      readingDirection,
    });
  }, [images, currentIndex, viewMode, firstPageIsCover, readingDirection]);

  if (!isOpen || !images || images.length === 0 || currentIndex < 0) return null;

  const menuItems = createViewerContextMenuItems({
    currentItem,
    t,
    canRename,
    canDelete,
    isZoomed: zoomPan.isZoomed,
    isTransformed,
    onShowInfo,
    onToggleMagnifier: () => magnifier.toggleMagnifier(),
    onOpenRename: () => setIsRenameOpen(true),
    onDelete: handleDelete,
    onActualSize: () => zoomPan.toggleActualSize(),
    onResetZoom: () => zoomPan.resetZoom(),
    onRotateCw: rotateClockwise,
    onRotateCcw: rotateCounterClockwise,
    onFlipH: toggleFlipH,
    onFlipV: toggleFlipV,
    onResetTransform: resetTransform,
    onClose,
  });

  return (
    <div
      ref={overlayRef}
      className={`viewer-overlay page-pos-${pageNumberPosition} ${magnifier.isMagnifierActive ? "magnifier-mode" : ""} ${zoomPan.isZoomed ? "is-zoomed" : ""} ${zoomPan.isDragging ? "is-dragging" : ""}`}
      onClick={overlayEvents.handleOverlayClick}
      onMouseDown={zoomPan.handleMouseDown}
      onMouseMove={overlayEvents.handleMouseMove}
      onMouseUp={zoomPan.handleMouseUp}
      onDoubleClick={overlayEvents.handleOverlayDoubleClick}
      onWheel={overlayEvents.handleWheel}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      <div className="direction-indicator" title={t("common.reading_direction")}>
        {readingDirection === "rtl" ? "⇦" : "⇨"}
      </div>

      <div className="viewer-badges-container">
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

        {transformBadgeFade.isVisible && (
          <div
            className={`viewer-zoom-badge viewer-transform-badge fade-${transformBadgeFade.fadeState}`}
            data-testid="viewer-transform-badge"
            onMouseEnter={transformBadgeFade.handleMouseEnter}
            onMouseLeave={transformBadgeFade.handleMouseLeave}
            onClick={(e) => {
              e.stopPropagation();
              resetTransform();
            }}
            title={t("view_menu.reset_transform", { defaultValue: "回転・反転をリセット" })}
          >
            <span className="viewer-zoom-badge-text">
              {getTransformBadgeText(imageTransform, t)}
            </span>
            <span className="viewer-zoom-badge-reset">✕</span>
          </div>
        )}
      </div>

      <div className={`viewer-container ${viewMode === "spread" ? "spread-view" : ""}`}>
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
                  transform={imageTransform}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  onDoubleClick={zoomPan.handleDoubleClick}
                />
              );
            })
          ) : (
            <div className="viewer-image-error" onClick={(e) => e.stopPropagation()}>
              <div className="error-icon">🖼️</div>
              <div className="error-text">表示できる画像がありません</div>
              <button className="error-retry-btn" onClick={onClose}>
                {t("common.close")}
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
        transform={imageTransform}
      />
    </div>
  );
}
