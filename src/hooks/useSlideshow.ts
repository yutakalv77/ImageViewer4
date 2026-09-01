import { useState, useEffect, useCallback } from "react";
import { getNextIndex, ViewerOptions } from "../utils/viewerUtils";

export function useSlideshow(
  options: ViewerOptions,
  intervalSeconds: number,
  loop: boolean,
  onNavigate: (update: number | ((prev: number) => number)) => void
) {
  const [isActive, setIsActive] = useState(false);
  const { viewMode, firstPageIsCover, totalImages, readingDirection } = options;

  // Auto-stop slideshow if totalImages becomes 0
  useEffect(() => {
    if (isActive && totalImages <= 0) {
      setIsActive(false);
    }
  }, [isActive, totalImages]);

  useEffect(() => {
    let timer: number | undefined;
    const safeInterval = Math.max(0.1, Number(intervalSeconds) || 3);

    if (isActive && totalImages > 0) {
      timer = window.setInterval(() => {
        onNavigate((currentIndex: number) => {
          const safeIndex = Math.max(0, Math.min(currentIndex, totalImages - 1));
          const next = getNextIndex(safeIndex, { viewMode, firstPageIsCover, totalImages, readingDirection });
          
          // If next is same as current (1 image only) or has wrapped around to beginning
          if (next === safeIndex || next < safeIndex) {
            if (loop) {
              return next;
            } else {
              setIsActive(false);
              return safeIndex;
            }
          }
          return next;
        });
      }, safeInterval * 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, viewMode, firstPageIsCover, totalImages, readingDirection, intervalSeconds, loop, onNavigate]);

  const start = useCallback(() => setIsActive(true), []);
  const stop = useCallback(() => setIsActive(false), []);

  return {
    isActive,
    start,
    stop
  };
}
