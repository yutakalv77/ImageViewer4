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
  if (!totalImages || totalImages <= 0) return 0;
  
  const safeCurrent = Math.max(0, Math.min(currentIndex, totalImages - 1));

  if (viewMode === "single") {
    return (safeCurrent + 1) % totalImages;
  }

  // Spread mode
  if (safeCurrent === 0 && firstPageIsCover) return 1 % totalImages;
  
  let next = safeCurrent;
  if (firstPageIsCover) {
    const currentPairBase = Math.floor((safeCurrent - 1) / 2) * 2 + 1;
    next = currentPairBase + 2;
  } else {
    const currentPairBase = Math.floor(safeCurrent / 2) * 2;
    next = currentPairBase + 2;
  }
  
  return next >= totalImages ? 0 : next;
}

export function getPrevIndex(
  currentIndex: number, 
  options: ViewerOptions
): number {
  const { viewMode, firstPageIsCover, totalImages } = options;
  if (!totalImages || totalImages <= 0) return 0;
  
  const safeCurrent = Math.max(0, Math.min(currentIndex, totalImages - 1));

  if (viewMode === "single") {
    return (safeCurrent - 1 + totalImages) % totalImages;
  }

  // Spread mode
  if (safeCurrent === 0) {
    // Go to last pair/page
    if (firstPageIsCover) {
      const lastBase = Math.floor((totalImages - 2) / 2) * 2 + 1;
      return Math.max(lastBase, 0);
    } else {
      const lastBase = Math.floor((totalImages - 1) / 2) * 2;
      return Math.max(lastBase, 0);
    }
  }
  
  if (firstPageIsCover) {
    if (safeCurrent <= 2) return 0;
    const currentPairBase = Math.floor((safeCurrent - 1) / 2) * 2 + 1;
    return Math.max(currentPairBase - 2, 0);
  } else {
    const currentPairBase = Math.floor(safeCurrent / 2) * 2;
    if (currentPairBase === 0) {
      const lastBase = Math.floor((totalImages - 1) / 2) * 2;
      return Math.max(lastBase, 0);
    }
    return Math.max(currentPairBase - 2, 0);
  }
}
