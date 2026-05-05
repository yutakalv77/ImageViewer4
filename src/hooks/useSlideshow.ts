import { useState, useEffect, useCallback } from "react";
import { getNextIndex, ViewerOptions } from "../utils/viewerUtils";

export function useSlideshow(
  options: ViewerOptions,
  intervalSeconds: number,
  loop: boolean,
  onNavigate: (update: number | ((prev: number) => number)) => void
) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let timer: number | undefined;
    if (isActive && options.totalImages > 0) {
      timer = window.setInterval(() => {
        onNavigate((currentIndex: number) => {
          const next = getNextIndex(currentIndex, options);
          
          if (next === currentIndex || next >= options.totalImages - 1) {
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
  }, [isActive, options, intervalSeconds, loop, onNavigate]);

  const start = useCallback(() => setIsActive(true), []);
  const stop = useCallback(() => setIsActive(false), []);

  return {
    isActive,
    start,
    stop
  };
}
