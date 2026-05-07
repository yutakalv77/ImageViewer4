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

  useEffect(() => {
    let timer: number | undefined;
    if (isActive && totalImages > 0) {
      timer = window.setInterval(() => {
        onNavigate((currentIndex: number) => {
          const next = getNextIndex(currentIndex, { viewMode, firstPageIsCover, totalImages, readingDirection });
          
          if (next === currentIndex || next >= totalImages - 1) {
             if (loop) return 0;
             setIsActive(false);
             return currentIndex;
          }
          return next;
        });
      }, intervalSeconds * 1000);
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
