import { useCallback, useEffect, useRef } from "react";
import { DOUBLE_CLICK_DELAY_MS } from "../utils/zoomPanUtils";

const WHEEL_COOLDOWN = 400; // ms
const WHEEL_THRESHOLD = 30;

export interface UseViewerOverlayEventsOptions {
  isMagnifierActive: boolean;
  isZoomed: boolean;
  hasDragged: boolean;
  clearHasDragged: () => void;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  magnifier: {
    handleWheel: (e: React.WheelEvent<HTMLDivElement>) => boolean;
    handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  };
  zoomPan: {
    handleWheel: (e: React.WheelEvent<HTMLDivElement>) => boolean;
    handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
    handleDoubleClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  };
}

export interface UseViewerOverlayEventsReturn {
  handleOverlayClick: () => void;
  handleOverlayDoubleClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
}

/**
 * Custom hook to handle overlay mouse and wheel events in ImageViewer
 */
export function useViewerOverlayEvents({
  isMagnifierActive,
  isZoomed,
  hasDragged,
  clearHasDragged,
  onClose,
  onNext,
  onPrev,
  magnifier,
  zoomPan,
}: UseViewerOverlayEventsOptions): UseViewerOverlayEventsReturn {
  const lastWheelTime = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup pending overlay click timer on unmount
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  const handleBaseWheel = useCallback(
    (e: React.WheelEvent) => {
      const now = Date.now();
      if (now - lastWheelTime.current < WHEEL_COOLDOWN) return;
      if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;

      if (e.deltaY > 0) {
        onNext();
      } else {
        onPrev();
      }
      lastWheelTime.current = now;
    },
    [onNext, onPrev]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (magnifier.handleWheel(e)) return;
      if (zoomPan.handleWheel(e)) return;
      handleBaseWheel(e);
    },
    [magnifier, zoomPan, handleBaseWheel]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      magnifier.handleMouseMove(e);
      zoomPan.handleMouseMove(e);
    },
    [magnifier, zoomPan]
  );

  const handleOverlayClick = useCallback(() => {
    if (isMagnifierActive) return;
    if (hasDragged) {
      clearHasDragged();
      return;
    }
    if (isZoomed) {
      return;
    }

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      onClose();
    }, DOUBLE_CLICK_DELAY_MS);
  }, [isMagnifierActive, hasDragged, isZoomed, clearHasDragged, onClose]);

  const handleOverlayDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      zoomPan.handleDoubleClick(e);
    },
    [zoomPan]
  );

  return {
    handleOverlayClick,
    handleOverlayDoubleClick,
    handleMouseMove,
    handleWheel,
  };
}
