import { PageNumberPosition, EntryItem } from "../types";

/**
 * Centralized logic for ImageViewer navigation and settings
 */

export const DEFAULT_PAGE_NUMBER_POSITION: PageNumberPosition = "bottom-center";

export interface PageNumberPositionOption {
  value: PageNumberPosition;
  labelKey: string;
}

export const PAGE_NUMBER_POSITION_OPTIONS: PageNumberPositionOption[] = [
  { value: "top-center", labelKey: "settings.page_pos_top_center" },
  { value: "bottom-center", labelKey: "settings.page_pos_bottom_center" },
  { value: "top-left", labelKey: "settings.page_pos_top_left" },
  { value: "bottom-left", labelKey: "settings.page_pos_bottom_left" },
  { value: "top-right", labelKey: "settings.page_pos_top_right" },
  { value: "bottom-right", labelKey: "settings.page_pos_bottom_right" },
  { value: "hidden", labelKey: "settings.page_pos_hidden" },
];

export function isPageNumberPosition(value: unknown): value is PageNumberPosition {
  return typeof value === "string" && PAGE_NUMBER_POSITION_OPTIONS.some(opt => opt.value === value);
}

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

export function getVisibleImages(
  images: EntryItem[],
  currentIndex: number,
  options: {
    viewMode: "single" | "spread";
    firstPageIsCover: boolean;
    readingDirection?: "rtl" | "ltr";
  }
): EntryItem[] {
  if (!images || images.length === 0) return [];
  const safeIndex = Math.max(0, Math.min(currentIndex, images.length - 1));

  if (options.viewMode === "single") {
    const img = images[safeIndex];
    return img ? [img] : [];
  }

  if (options.firstPageIsCover && safeIndex === 0) {
    const img = images[0];
    return img ? [img] : [];
  }

  let pairStart = safeIndex;
  if (options.firstPageIsCover) {
    if (pairStart % 2 === 0) pairStart -= 1;
    pairStart = Math.max(1, pairStart);
  } else {
    if (pairStart % 2 !== 0) pairStart -= 1;
    pairStart = Math.max(0, pairStart);
  }

  const pair: EntryItem[] = [];
  if (images[pairStart]) {
    pair.push(images[pairStart]);
  }
  if (pairStart + 1 < images.length && images[pairStart + 1]) {
    pair.push(images[pairStart + 1]);
  }

  if (pair.length === 0 && images[safeIndex]) {
    pair.push(images[safeIndex]);
  }

  if (options.readingDirection === "rtl") {
    return [...pair].reverse();
  }
  return pair;
}

export function formatViewerInfo(
  t: (key: string, params?: Record<string, unknown>) => string,
  options: {
    viewMode: "single" | "spread";
    currentIndex: number;
    totalImages: number;
    currentImageName?: string;
  }
): string {
  const { viewMode, currentIndex, totalImages, currentImageName } = options;
  if (viewMode === "single") {
    return t("slideshow.viewer_info_single", {
      page: currentIndex + 1,
      total: totalImages,
      name: currentImageName || "",
    });
  }
  return t("slideshow.viewer_info", {
    page: Math.min(currentIndex + 1, totalImages),
    total: totalImages,
  });
}

export interface PostDeleteNavigationResult {
  shouldClose: boolean;
  nextIndex: number;
}

/**
 * Calculates the next viewer state after an image has been deleted.
 * If 1 or fewer images were present before deletion, the viewer should close.
 * If the deleted image was at the end of the list, move to the preceding image.
 * Otherwise, retain the same index (which now refers to the next image).
 */
export function getPostDeleteNavigation(
  currentIndex: number,
  totalCount: number
): PostDeleteNavigationResult {
  if (totalCount <= 1) {
    return { shouldClose: true, nextIndex: -1 };
  }
  if (currentIndex >= totalCount - 1) {
    return { shouldClose: false, nextIndex: totalCount - 2 };
  }
  return { shouldClose: false, nextIndex: currentIndex };
}

export * from "./wheelNavigationUtils";



