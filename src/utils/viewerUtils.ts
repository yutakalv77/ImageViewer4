/**
 * Centralized logic for ImageViewer navigation
 */

export interface ViewerOptions {
  viewMode: "single" | "spread";
  firstPageIsCover: boolean;
  totalImages: number;
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
  const step = (currentIndex === 0 && firstPageIsCover) ? 1 : 2;
  return Math.min(currentIndex + step, totalImages - 1);
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
  if (firstPageIsCover) {
    if (currentIndex <= 2) return 0;
    return currentIndex - 2;
  }
  
  return Math.max(currentIndex - 2, 0);
}
