import { describe, it, expect } from "vitest";
import {
  calculateGridColumns,
  calculateTotalRows,
  calculateRowHeight,
  calculateTotalHeight,
  calculateVisibleRowRange,
  calculateVisibleItemIndices,
  calculateVirtualPadding,
  calculateItemScrollPosition,
} from "../utils/virtualGridUtils";

describe("virtualGridUtils", () => {
  describe("calculateGridColumns", () => {
    it("returns at least 1 column for non-positive or small widths", () => {
      expect(calculateGridColumns(0, 160)).toBe(1);
      expect(calculateGridColumns(-100, 160)).toBe(1);
      expect(calculateGridColumns(100, 160)).toBe(1);
    });

    it("calculates columns correctly with gap and padding", () => {
      // availableWidth = 520 - 40 = 480.
      // (480 + 20) / (160 + 20) = 500 / 180 = 2.77 -> 2 cols
      expect(calculateGridColumns(520, 160, 20, 20)).toBe(2);

      // (560 - 40 + 20) / 180 = 540 / 180 = 3 cols
      expect(calculateGridColumns(560, 160, 20, 20)).toBe(3);
    });
  });

  describe("calculateTotalRows", () => {
    it("handles 0 or negative items", () => {
      expect(calculateTotalRows(0, 4)).toBe(0);
      expect(calculateTotalRows(-5, 4)).toBe(0);
      expect(calculateTotalRows(10, 0)).toBe(0);
    });

    it("calculates rows with ceiling division", () => {
      expect(calculateTotalRows(10, 4)).toBe(3); // 4 + 4 + 2 = 3 rows
      expect(calculateTotalRows(12, 4)).toBe(3); // 4 + 4 + 4 = 3 rows
      expect(calculateTotalRows(13, 4)).toBe(4);
    });
  });

  describe("calculateRowHeight", () => {
    it("estimates card height correctly", () => {
      // 160 * 1.41 = 225.6 -> 226 + 38 = 264
      expect(calculateRowHeight(160)).toBe(264);
      expect(calculateRowHeight(160, 300)).toBe(300);
    });
  });

  describe("calculateTotalHeight", () => {
    it("returns 0 when totalRows is 0", () => {
      expect(calculateTotalHeight(0, 260, 20, 20)).toBe(0);
    });

    it("calculates total scroll height correctly", () => {
      // 1 row: 1 * 260 + 0 * 20 + 40 = 300
      expect(calculateTotalHeight(1, 260, 20, 20)).toBe(300);
      // 3 rows: 3 * 260 + 2 * 20 + 40 = 780 + 40 + 40 = 860
      expect(calculateTotalHeight(3, 260, 20, 20)).toBe(860);
    });
  });

  describe("calculateVisibleRowRange", () => {
    it("returns empty range when totalRows is 0", () => {
      expect(calculateVisibleRowRange(0, 600, 0, 260)).toEqual({ startRow: 0, endRow: -1 });
    });

    it("calculates range at top with overscan", () => {
      // 100 rows, rowStep = 280 (260 + 20)
      // scrollTop = 0, viewport = 600
      // firstVisibleRow = 0, lastVisibleRow = Math.floor(580 / 280) = 2
      // overscan = 2 -> startRow = 0, endRow = 4
      const range = calculateVisibleRowRange(0, 600, 100, 260, 20, 20, 2);
      expect(range.startRow).toBe(0);
      expect(range.endRow).toBe(4);
    });

    it("calculates range in middle of list with overscan", () => {
      // scrollTop = 2800 (around row 10)
      // viewport = 600
      const range = calculateVisibleRowRange(2800, 600, 100, 260, 20, 20, 2);
      expect(range.startRow).toBe(7); // firstVisible is ~9, minus 2
      expect(range.endRow).toBe(14); // lastVisible is ~12, plus 2
    });

    it("clamps range at the end of list", () => {
      const range = calculateVisibleRowRange(50000, 600, 20, 260, 20, 20, 2);
      expect(range.endRow).toBe(19);
    });
  });

  describe("calculateVisibleItemIndices", () => {
    it("returns empty range for empty rows or items", () => {
      expect(calculateVisibleItemIndices(0, -1, 4, 100)).toEqual({ startIndex: 0, endIndex: -1 });
      expect(calculateVisibleItemIndices(0, 4, 4, 0)).toEqual({ startIndex: 0, endIndex: -1 });
    });

    it("calculates slice indices accurately", () => {
      // startRow 2, endRow 4, 4 columns, 50 items
      // startRow 2 -> index 8
      // endRow 4 -> index (4 + 1) * 4 - 1 = 19
      expect(calculateVisibleItemIndices(2, 4, 4, 50)).toEqual({ startIndex: 8, endIndex: 19 });

      // Clamps to totalItems - 1
      expect(calculateVisibleItemIndices(2, 4, 4, 15)).toEqual({ startIndex: 8, endIndex: 14 });
    });
  });

  describe("calculateVirtualPadding and invariant verification", () => {
    it("maintains invariant that paddingTop + renderedHeight + paddingBottom === totalHeight", () => {
      const totalItems = 100;
      const columns = 4;
      const totalRows = calculateTotalRows(totalItems, columns); // 25 rows
      const rowHeight = 260;
      const gap = 20;
      const padding = 20;
      const totalHeight = calculateTotalHeight(totalRows, rowHeight, gap, padding);

      // Test across multiple scroll positions
      const scrollPositions = [0, 500, 1500, 3000, 5000, 6500];
      for (const scrollTop of scrollPositions) {
        const { startRow, endRow } = calculateVisibleRowRange(
          scrollTop,
          800,
          totalRows,
          rowHeight,
          gap,
          padding,
          2
        );

        const { paddingTop, paddingBottom } = calculateVirtualPadding(
          startRow,
          endRow,
          totalRows,
          rowHeight,
          gap,
          padding
        );

        const renderedRowsCount = endRow - startRow + 1;
        const renderedHeight =
          renderedRowsCount * rowHeight + Math.max(0, renderedRowsCount - 1) * gap;

        const totalCalculated = paddingTop + renderedHeight + paddingBottom;
        expect(totalCalculated).toBe(totalHeight);
      }
    });
  });

  describe("calculateItemScrollPosition", () => {
    it("calculates scroll position when item is above viewport", () => {
      // row 1: itemTop = 20 + 1 * 280 = 300
      // currentScrollTop = 500
      // Since itemTop (300) < currentScrollTop (500), should scroll up to itemTop - padding = 280
      const newScroll = calculateItemScrollPosition(4, 4, 260, 500, 600, 20, 20);
      expect(newScroll).toBe(280);
    });

    it("calculates scroll position when item is below viewport", () => {
      // row 5: itemTop = 20 + 5 * 280 = 1420, itemBottom = 1680
      // currentScrollTop = 500, viewport = 600 (visible range 500 to 1100)
      // itemBottom (1680) > 1100, should scroll down to 1680 - 600 + 20 = 1100
      const newScroll = calculateItemScrollPosition(20, 4, 260, 500, 600, 20, 20);
      expect(newScroll).toBe(1100);
    });

    it("keeps current scroll position when item is already visible", () => {
      // row 2: itemTop = 580, itemBottom = 840
      // currentScrollTop = 500, viewport = 600 (visible range 500 to 1100)
      const newScroll = calculateItemScrollPosition(8, 4, 260, 500, 600, 20, 20);
      expect(newScroll).toBe(500);
    });
  });
});
