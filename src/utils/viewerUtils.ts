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
  if (totalImages <= 0) return 0;
  
  if (viewMode === "single") {
    return (currentIndex + 1) % totalImages;
  }

  // Spread mode
  if (currentIndex === 0 && firstPageIsCover) return 1 % totalImages;
  
  let next = currentIndex;
  if (firstPageIsCover) {
    const currentPairBase = Math.floor((currentIndex - 1) / 2) * 2 + 1;
    next = currentPairBase + 2;
  } else {
    const currentPairBase = Math.floor(currentIndex / 2) * 2;
    next = currentPairBase + 2;
  }
  
  return next >= totalImages ? 0 : next;
}

export function getPrevIndex(
  currentIndex: number, 
  options: ViewerOptions
): number {
  const { viewMode, firstPageIsCover, totalImages } = options;
  if (totalImages <= 0) return 0;
  
  if (viewMode === "single") {
    return (currentIndex - 1 + totalImages) % totalImages;
  }

  // Spread mode
  if (currentIndex === 0) {
    // Go to last pair/page
    if (firstPageIsCover) {
      // Find last pair base
      const lastBase = Math.floor((totalImages - 2) / 2) * 2 + 1;
      return Math.max(lastBase, 0);
    } else {
      const lastBase = Math.floor((totalImages - 1) / 2) * 2;
      return lastBase;
    }
  }
  
  if (firstPageIsCover) {
    if (currentIndex <= 2) return 0;
    const currentPairBase = Math.floor((currentIndex - 1) / 2) * 2 + 1;
    return Math.max(currentPairBase - 2, 0);
  } else {
    const currentPairBase = Math.floor(currentIndex / 2) * 2;
    if (currentPairBase === 0) {
        // Find last pair base
        const lastBase = Math.floor((totalImages - 1) / 2) * 2;
        return lastBase;
    }
    return Math.max(currentPairBase - 2, 0);
  }
}
