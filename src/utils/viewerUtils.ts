/**
 * Centralized logic for ImageViewer navigation
 */

export interface ViewerOptions {
  viewMode: "single" | "spread";
  firstPageIsCover: boolean;
  totalImages: number;
  readingDirection?: "rtl" | "ltr";
}

export function getNextIndex(
  currentIndex: number, 
  options: ViewerOptions
): number {
  const { viewMode, firstPageIsCover, totalImages } = options;
  
  if (viewMode === "single") {
    return Math.min(currentIndex + 1, totalImages - 1);
  }

  // Spread mode
  if (currentIndex === 0 && firstPageIsCover) return Math.min(1, totalImages - 1);
  
  // Calculate potential next pair start
  let next = currentIndex;
  if (firstPageIsCover) {
    // 0(cover), 1-2, 3-4...
    // If we are at 1 or 2, next is 3.
    const currentPairBase = Math.floor((currentIndex - 1) / 2) * 2 + 1;
    next = currentPairBase + 2;
  } else {
    // 0-1, 2-3, 4-5...
    const currentPairBase = Math.floor(currentIndex / 2) * 2;
    next = currentPairBase + 2;
  }
  
  return Math.min(next, totalImages - 1);
}

export function getPrevIndex(
  currentIndex: number, 
  options: ViewerOptions
): number {
  const { viewMode, firstPageIsCover } = options;
  
  if (viewMode === "single") {
    return Math.max(currentIndex - 1, 0);
  }

  // Spread mode
  if (currentIndex === 0) return 0;
  
  if (firstPageIsCover) {
    if (currentIndex <= 2) return 0;
    const currentPairBase = Math.floor((currentIndex - 1) / 2) * 2 + 1;
    return Math.max(currentPairBase - 2, 0);
  } else {
    const currentPairBase = Math.floor(currentIndex / 2) * 2;
    return Math.max(currentPairBase - 2, 0);
  }
}
