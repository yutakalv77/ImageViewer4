/**
 * Pure utility functions for virtual grid calculations.
 */

export interface VirtualRowRange {
  startRow: number;
  endRow: number;
}

export interface VirtualItemIndices {
  startIndex: number;
  endIndex: number;
}

export interface VirtualPadding {
  paddingTop: number;
  paddingBottom: number;
}

/**
 * Calculates the number of columns that fit in the container.
 */
export function calculateGridColumns(
  containerWidth: number,
  itemWidth: number,
  gap: number = 20,
  padding: number = 20
): number {
  if (containerWidth <= 0 || itemWidth <= 0) return 1;
  const availableWidth = Math.max(0, containerWidth - padding * 2);
  const cols = Math.floor((availableWidth + gap) / (itemWidth + gap));
  return Math.max(1, cols);
}

/**
 * Calculates total rows needed for the given items and column count.
 */
export function calculateTotalRows(totalItems: number, columns: number): number {
  if (totalItems <= 0 || columns <= 0) return 0;
  return Math.ceil(totalItems / columns);
}

/**
 * Calculates estimated row height for an EntryCard based on thumbnailSize.
 */
export function calculateRowHeight(thumbnailSize: number, customHeight?: number): number {
  if (customHeight && customHeight > 0) return customHeight;
  // Based on EntryCard.css:
  // thumbnailContainer: round(thumbnailSize * 1.41)
  // nameContainer: min 24px + 8px padding + 2px border + 4px margins ~ 38px
  return Math.round(thumbnailSize * 1.41) + 38;
}

/**
 * Calculates the total scroll height of the entire grid.
 */
export function calculateTotalHeight(
  totalRows: number,
  rowHeight: number,
  gap: number = 20,
  padding: number = 20
): number {
  if (totalRows <= 0 || rowHeight <= 0) return 0;
  return totalRows * rowHeight + Math.max(0, totalRows - 1) * gap + padding * 2;
}

/**
 * Calculates the visible row range [startRow, endRow] with overscan.
 */
export function calculateVisibleRowRange(
  scrollTop: number,
  viewportHeight: number,
  totalRows: number,
  rowHeight: number,
  gap: number = 20,
  padding: number = 20,
  overscanRows: number = 2
): VirtualRowRange {
  if (totalRows <= 0 || rowHeight <= 0 || viewportHeight <= 0) {
    return { startRow: 0, endRow: -1 };
  }

  const rowStep = rowHeight + gap;
  const effectiveScrollTop = Math.max(0, scrollTop);

  const firstVisibleRow = Math.floor(Math.max(0, effectiveScrollTop - padding) / rowStep);
  const lastVisibleRow = Math.floor(Math.max(0, effectiveScrollTop + viewportHeight - padding) / rowStep);

  const clampedFirst = Math.max(0, Math.min(totalRows - 1, firstVisibleRow));
  const clampedLast = Math.max(0, Math.min(totalRows - 1, lastVisibleRow));

  const startRow = Math.max(0, clampedFirst - overscanRows);
  const endRow = Math.min(totalRows - 1, clampedLast + overscanRows);

  return { startRow, endRow };
}

/**
 * Calculates the slice of item indices [startIndex, endIndex] corresponding to the row range.
 */
export function calculateVisibleItemIndices(
  startRow: number,
  endRow: number,
  columns: number,
  totalItems: number
): VirtualItemIndices {
  if (totalItems <= 0 || columns <= 0 || startRow > endRow || startRow < 0) {
    return { startIndex: 0, endIndex: -1 };
  }

  const startIndex = Math.max(0, Math.min(totalItems - 1, startRow * columns));
  const endIndex = Math.min(totalItems - 1, (endRow + 1) * columns - 1);

  return { startIndex, endIndex };
}

/**
 * Calculates top and bottom virtual padding for the grid container.
 */
export function calculateVirtualPadding(
  startRow: number,
  endRow: number,
  totalRows: number,
  rowHeight: number,
  gap: number = 20,
  padding: number = 20
): VirtualPadding {
  if (totalRows <= 0 || rowHeight <= 0 || startRow > endRow || startRow < 0) {
    return { paddingTop: padding, paddingBottom: padding };
  }

  const rowStep = rowHeight + gap;

  // Height of unrendered rows above startRow
  const paddingTop = padding + startRow * rowStep;

  // Height of unrendered rows below endRow
  const remainingRows = Math.max(0, totalRows - 1 - endRow);
  const paddingBottom = padding + remainingRows * rowStep;

  return { paddingTop, paddingBottom };
}

/**
 * Calculates the required scrollTop to make an item at given index visible.
 */
export function calculateItemScrollPosition(
  index: number,
  columns: number,
  rowHeight: number,
  currentScrollTop: number,
  viewportHeight: number,
  gap: number = 20,
  padding: number = 20
): number {
  if (index < 0 || columns <= 0 || rowHeight <= 0 || viewportHeight <= 0) {
    return currentScrollTop;
  }

  const row = Math.floor(index / columns);
  const rowStep = rowHeight + gap;
  const itemTop = padding + row * rowStep;
  const itemBottom = itemTop + rowHeight;

  if (itemTop < currentScrollTop) {
    return Math.max(0, itemTop - padding);
  }

  if (itemBottom > currentScrollTop + viewportHeight) {
    return itemBottom - viewportHeight + padding;
  }

  return currentScrollTop;
}
