import { useState, useCallback, useEffect, useMemo } from "react";
import {
  DEFAULT_ZOOM,
  DEFAULT_LENS_SIZE,
  stepZoom,
  stepLensSize,
  findViewerImageElement,
  getContainedImageRect,
  RectLike,
} from "../utils/magnifierUtils";

export interface UseMagnifierReturn {
  isMagnifierActive: boolean;
  zoom: number;
  lensSize: number;
  cursorPos: { x: number; y: number };
  activeImageSrc: string | null;
  activeImageRect: RectLike | null;
  containerRect: { width: number; height: number } | null;
  toggleMagnifier: () => void;
  setMagnifierActive: (active: boolean) => void;
  resetActiveImage: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  increaseLensSize: () => void;
  decreaseLensSize: () => void;
  handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleWheel: (e: React.WheelEvent<HTMLDivElement>) => boolean;
}

/**
 * Custom hook to manage state and interactions for the magnifier loupe.
 */
export function useMagnifier(
  containerRef: React.RefObject<HTMLDivElement | null>,
  activeKey?: any
): UseMagnifierReturn {
  const [isMagnifierActive, setMagnifierActive] = useState(false);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [lensSize, setLensSize] = useState(DEFAULT_LENS_SIZE);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeImageSrc, setActiveImageSrc] = useState<string | null>(null);
  const [activeImageRect, setActiveImageRect] = useState<RectLike | null>(null);
  const [containerRect, setContainerRect] = useState<{ width: number; height: number } | null>(null);

  // Reset active image when image key (e.g. currentIndex) changes
  useEffect(() => {
    setActiveImageSrc(null);
    setActiveImageRect(null);
  }, [activeKey]);

  // Automatically initialize container dimensions and active image when activated
  useEffect(() => {
    if (!isMagnifierActive) return;
    const container = containerRef.current;
    if (!container) return;

    const cRect = container.getBoundingClientRect();
    setContainerRect({ width: cRect.width, height: cRect.height });

    setCursorPos((prev) => {
      if (prev.x === 0 && prev.y === 0) {
        return { x: cRect.width / 2, y: cRect.height / 2 };
      }
      return prev;
    });

    const imgEl = container.querySelector<HTMLImageElement>("img.viewer-image");
    const src = imgEl ? (imgEl.currentSrc || imgEl.src) : null;
    if (imgEl && src) {
      const rawRect = imgEl.getBoundingClientRect();
      const containedRect = getContainedImageRect(
        {
          left: rawRect.left - cRect.left,
          top: rawRect.top - cRect.top,
          width: rawRect.width,
          height: rawRect.height,
        },
        imgEl.naturalWidth || rawRect.width,
        imgEl.naturalHeight || rawRect.height
      );
      setActiveImageSrc(src);
      setActiveImageRect(containedRect);
    }
  }, [isMagnifierActive, containerRef]);

  const toggleMagnifier = useCallback(() => {
    setMagnifierActive((prev) => !prev);
  }, []);

  const resetActiveImage = useCallback(() => {
    setActiveImageSrc(null);
    setActiveImageRect(null);
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((prev) => stepZoom(prev, 1));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => stepZoom(prev, -1));
  }, []);

  const increaseLensSize = useCallback(() => {
    setLensSize((prev) => stepLensSize(prev, 1));
  }, []);

  const decreaseLensSize = useCallback(() => {
    setLensSize((prev) => stepLensSize(prev, -1));
  }, []);

  // Update image under cursor
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isMagnifierActive) return;

      const container = containerRef.current;
      if (!container) return;

      const cRect = container.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      setContainerRect({ width: cRect.width, height: cRect.height });
      setCursorPos({
        x: clientX - cRect.left,
        y: clientY - cRect.top,
      });

      // Find the image under or closest to the cursor
      const imgEl = findViewerImageElement(clientX, clientY, container);
      const src = imgEl ? (imgEl.currentSrc || imgEl.src) : null;
      if (imgEl && src) {
        const rawRect = imgEl.getBoundingClientRect();
        const containedRect = getContainedImageRect(
          {
            left: rawRect.left - cRect.left,
            top: rawRect.top - cRect.top,
            width: rawRect.width,
            height: rawRect.height,
          },
          imgEl.naturalWidth || rawRect.width,
          imgEl.naturalHeight || rawRect.height
        );
        setActiveImageSrc(src);
        setActiveImageRect(containedRect);
      }
    },
    [isMagnifierActive, containerRef]
  );

  // Wheel handling: Ctrl+Wheel for zoom, Shift+Wheel for lens size
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>): boolean => {
      if (!isMagnifierActive) return false;

      if (e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY < 0 ? 1 : -1;
        setZoom((prev) => stepZoom(prev, delta));
        return true;
      }

      if (e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY < 0 ? 1 : -1;
        setLensSize((prev) => stepLensSize(prev, delta));
        return true;
      }

      return false;
    },
    [isMagnifierActive]
  );

  return useMemo(
    () => ({
      isMagnifierActive,
      zoom,
      lensSize,
      cursorPos,
      activeImageSrc,
      activeImageRect,
      containerRect,
      toggleMagnifier,
      setMagnifierActive,
      resetActiveImage,
      zoomIn,
      zoomOut,
      increaseLensSize,
      decreaseLensSize,
      handleMouseMove,
      handleWheel,
    }),
    [
      isMagnifierActive,
      zoom,
      lensSize,
      cursorPos,
      activeImageSrc,
      activeImageRect,
      containerRect,
      toggleMagnifier,
      setMagnifierActive,
      resetActiveImage,
      zoomIn,
      zoomOut,
      increaseLensSize,
      decreaseLensSize,
      handleMouseMove,
      handleWheel,
    ]
  );
}
