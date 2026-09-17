import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  Point,
  Size,
  FIT_ZOOM_SCALE,
  calculateWheelZoom,
  calculateStepZoom,
  calculateZoomOffset,
  clampOffset,
  clampScale,
  isDragThresholdExceeded,
} from "../utils/zoomPanUtils";

export interface UseZoomPanOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  activeKey?: any;
  enabled?: boolean;
}

export interface UseZoomPanReturn {
  scale: number;
  offset: Point;
  isZoomed: boolean;
  isDragging: boolean;
  hasDragged: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setActualSize: () => void;
  handleWheel: (e: React.WheelEvent<HTMLDivElement>) => boolean;
  handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleDoubleClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  clearHasDragged: () => void;
}

/**
 * Custom hook to manage full-image zooming and panning (mouse drag, wheel zoom, double-click)
 */
export function useZoomPan({
  containerRef,
  activeKey,
  enabled = true,
}: UseZoomPanOptions): UseZoomPanReturn {
  const [scale, setScale] = useState<number>(FIT_ZOOM_SCALE);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [hasDragged, setHasDragged] = useState<boolean>(false);

  // References for drag interaction to avoid re-renders during drag tracking
  const dragStartRef = useRef<Point>({ x: 0, y: 0 });
  const initialOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const hasDraggedRef = useRef<boolean>(false);

  // Reset zoom & pan when image changes (e.g. index/path)
  useEffect(() => {
    setScale(FIT_ZOOM_SCALE);
    setOffset({ x: 0, y: 0 });
    setIsDragging(false);
    setHasDragged(false);
    hasDraggedRef.current = false;
  }, [activeKey]);

  const getContainerSize = useCallback((): Size => {
    const container = containerRef.current;
    if (!container) {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    const rect = container.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }, [containerRef]);

  const isZoomed = useMemo(() => scale > 1.01, [scale]);

  const resetZoom = useCallback(() => {
    setScale(FIT_ZOOM_SCALE);
    setOffset({ x: 0, y: 0 });
    setIsDragging(false);
    setHasDragged(false);
    hasDraggedRef.current = false;
  }, []);

  const zoomIn = useCallback(() => {
    if (!enabled) return;
    const containerSize = getContainerSize();
    const result = calculateStepZoom(scale, offset, containerSize, "in");
    setScale(result.scale);
    setOffset(result.offset);
  }, [enabled, scale, offset, getContainerSize]);

  const zoomOut = useCallback(() => {
    if (!enabled) return;
    const containerSize = getContainerSize();
    const result = calculateStepZoom(scale, offset, containerSize, "out");
    setScale(result.scale);
    setOffset(result.offset);
  }, [enabled, scale, offset, getContainerSize]);

  const setActualSize = useCallback(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    const imgEl = container.querySelector<HTMLImageElement>("img.viewer-image");
    if (imgEl && imgEl.naturalWidth > 0 && imgEl.clientWidth > 0) {
      // Scale ratio to make the image 100% natural pixel size
      const targetScale = clampScale(imgEl.naturalWidth / imgEl.clientWidth);
      setScale(targetScale);
      setOffset({ x: 0, y: 0 });
    } else {
      // Fallback: 2.0x
      setScale(2.0);
      setOffset({ x: 0, y: 0 });
    }
  }, [enabled, containerRef]);

  // Wheel zoom with Ctrl key
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>): boolean => {
      if (!enabled || !e.ctrlKey) {
        return false;
      }

      e.preventDefault();
      e.stopPropagation();

      const container = containerRef.current;
      const containerSize = getContainerSize();
      const rect = container
        ? container.getBoundingClientRect()
        : { left: 0, top: 0, width: containerSize.width, height: containerSize.height };

      const cursorPos: Point = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      const result = calculateWheelZoom(scale, offset, cursorPos, containerSize, e.deltaY);
      setScale(result.scale);
      setOffset(result.offset);
      return true;
    },
    [enabled, scale, offset, containerRef, getContainerSize]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enabled || scale <= 1.01 || e.button !== 0) {
        return;
      }

      e.preventDefault();
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      initialOffsetRef.current = { ...offset };
      hasDraggedRef.current = false;
      setHasDragged(false);
      setIsDragging(true);
    },
    [enabled, scale, offset]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging) return;

      const currentPos = { x: e.clientX, y: e.clientY };
      if (!hasDraggedRef.current && isDragThresholdExceeded(dragStartRef.current, currentPos)) {
        hasDraggedRef.current = true;
        setHasDragged(true);
      }

      const dx = currentPos.x - dragStartRef.current.x;
      const dy = currentPos.y - dragStartRef.current.y;

      const rawOffset: Point = {
        x: initialOffsetRef.current.x + dx,
        y: initialOffsetRef.current.y + dy,
      };

      const containerSize = getContainerSize();
      const clamped = clampOffset(rawOffset, scale, containerSize);
      setOffset(clamped);
    },
    [isDragging, scale, getContainerSize]
  );

  const handleMouseUp = useCallback(
    (_e: React.MouseEvent<HTMLDivElement>) => {
      if (isDragging) {
        setIsDragging(false);
      }
    },
    [isDragging]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enabled || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      if (scale > 1.05) {
        // Reset to fit
        resetZoom();
      } else {
        // Zoom in to 2.0x centered on click position
        const container = containerRef.current;
        const containerSize = getContainerSize();
        const rect = container
          ? container.getBoundingClientRect()
          : { left: 0, top: 0, width: containerSize.width, height: containerSize.height };

        const cursorRelCenter: Point = {
          x: e.clientX - rect.left - containerSize.width / 2,
          y: e.clientY - rect.top - containerSize.height / 2,
        };

        const targetScale = 2.0;
        const newOffset = clampOffset(
          calculateZoomOffset(scale, targetScale, offset, cursorRelCenter),
          targetScale,
          containerSize
        );

        setScale(targetScale);
        setOffset(newOffset);
      }
    },
    [enabled, scale, offset, containerRef, getContainerSize, resetZoom]
  );

  const clearHasDragged = useCallback(() => {
    setHasDragged(false);
    hasDraggedRef.current = false;
  }, []);

  return {
    scale,
    offset,
    isZoomed,
    isDragging,
    hasDragged,
    zoomIn,
    zoomOut,
    resetZoom,
    setActualSize,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDoubleClick,
    clearHasDragged,
  };
}
