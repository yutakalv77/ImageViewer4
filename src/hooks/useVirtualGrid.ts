import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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

export interface UseVirtualGridOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  totalItems: number;
  itemWidth: number;
  estimatedItemHeight?: number;
  gap?: number;
  padding?: number;
  overscanRows?: number;
}

export interface UseVirtualGridResult {
  startIndex: number;
  endIndex: number;
  columns: number;
  totalRows: number;
  totalHeight: number;
  paddingTop: number;
  paddingBottom: number;
  rowHeight: number;
  scrollToIndex: (index: number) => void;
  measureElement: (el: HTMLElement | null) => void;
}

/**
 * Custom hook providing virtual grid calculations and scroll synchronization.
 */
export function useVirtualGrid({
  containerRef,
  totalItems,
  itemWidth,
  estimatedItemHeight,
  gap = 20,
  padding = 20,
  overscanRows = 2,
}: UseVirtualGridOptions): UseVirtualGridResult {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

  const rafIdRef = useRef<number | null>(null);

  // Synchronize container scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        if (containerRef.current) {
          setScrollTop(containerRef.current.scrollTop);
        }
        rafIdRef.current = null;
      });
    };

    // Initial scroll position
    setScrollTop(container.scrollTop);
    container.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", onScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [containerRef]);

  // Observe container dimensions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      if (container) {
        setContainerSize({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };

    updateSize();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        updateSize();
      });
      observer.observe(container);
      return () => observer.disconnect();
    } else {
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }
  }, [containerRef]);

  // Calculate layout metrics
  const columns = useMemo(() => {
    return calculateGridColumns(containerSize.width, itemWidth, gap, padding);
  }, [containerSize.width, itemWidth, gap, padding]);

  const rowHeight = useMemo(() => {
    return calculateRowHeight(itemWidth, measuredHeight ?? estimatedItemHeight);
  }, [itemWidth, measuredHeight, estimatedItemHeight]);

  const totalRows = useMemo(() => {
    return calculateTotalRows(totalItems, columns);
  }, [totalItems, columns]);

  const totalHeight = useMemo(() => {
    return calculateTotalHeight(totalRows, rowHeight, gap, padding);
  }, [totalRows, rowHeight, gap, padding]);

  const { startRow, endRow } = useMemo(() => {
    const effectiveHeight = containerSize.height || 600;
    return calculateVisibleRowRange(
      scrollTop,
      effectiveHeight,
      totalRows,
      rowHeight,
      gap,
      padding,
      overscanRows
    );
  }, [scrollTop, containerSize.height, totalRows, rowHeight, gap, padding, overscanRows]);

  const { startIndex, endIndex } = useMemo(() => {
    return calculateVisibleItemIndices(startRow, endRow, columns, totalItems);
  }, [startRow, endRow, columns, totalItems]);

  const { paddingTop, paddingBottom } = useMemo(() => {
    return calculateVirtualPadding(startRow, endRow, totalRows, rowHeight, gap, padding);
  }, [startRow, endRow, totalRows, rowHeight, gap, padding]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const container = containerRef.current;
      if (!container || index < 0 || index >= totalItems) return;

      const newScroll = calculateItemScrollPosition(
        index,
        columns,
        rowHeight,
        container.scrollTop,
        container.clientHeight,
        gap,
        padding
      );

      if (newScroll !== container.scrollTop) {
        container.scrollTop = newScroll;
        setScrollTop(newScroll);
      }
    },
    [containerRef, totalItems, columns, rowHeight, gap, padding]
  );

  const measureElement = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const h = el.offsetHeight;
    if (h > 0) {
      setMeasuredHeight((prev) => (prev === h ? prev : h));
    }
  }, []);

  return {
    startIndex,
    endIndex,
    columns,
    totalRows,
    totalHeight,
    paddingTop,
    paddingBottom,
    rowHeight,
    scrollToIndex,
    measureElement,
  };
}
