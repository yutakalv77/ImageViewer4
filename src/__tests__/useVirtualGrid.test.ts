import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVirtualGrid } from "../hooks/useVirtualGrid";
import { HIGH_PERF_OVERSCAN_ROWS } from "../constants";

describe("useVirtualGrid hook", () => {
  const createMockContainer = (width = 800, height = 600, initialScrollTop = 0) => {
    const el = document.createElement("div");
    Object.defineProperty(el, "clientWidth", { configurable: true, value: width });
    Object.defineProperty(el, "clientHeight", { configurable: true, value: height });
    el.scrollTop = initialScrollTop;
    return el;
  };

  it("calculates initial virtual layout metrics", () => {
    const container = createMockContainer(800, 600, 0);
    const containerRef = { current: container };

    const { result } = renderHook(() =>
      useVirtualGrid({
        containerRef,
        totalItems: 100,
        itemWidth: 160,
        estimatedItemHeight: 260,
        gap: 20,
        padding: 20,
        overscanRows: 2,
      })
    );

    // 800 width: available = 760. (760 + 20) / 180 = 780 / 180 = 4 columns
    expect(result.current.columns).toBe(4);
    expect(result.current.totalRows).toBe(25);
    expect(result.current.startIndex).toBe(0);
    // At top with overscan 2, visible rows are 0..2 plus overscan 2 = 0..4 (5 rows * 4 = 20 items: 0..19)
    expect(result.current.endIndex).toBe(19);
    expect(result.current.paddingTop).toBe(20);
    expect(result.current.paddingBottom).toBeGreaterThan(0);
  });

  it("adjusts visible range when scrolling", () => {
    const container = createMockContainer(800, 600, 0);
    const containerRef = { current: container };

    const { result } = renderHook(() =>
      useVirtualGrid({
        containerRef,
        totalItems: 100,
        itemWidth: 160,
        estimatedItemHeight: 260,
        gap: 20,
        padding: 20,
        overscanRows: 2,
      })
    );

    // Simulate scroll to middle (row 10 = ~2800px)
    act(() => {
      container.scrollTop = 2800;
      container.dispatchEvent(new Event("scroll"));
    });

    // Wait for RAF
    expect(result.current.columns).toBe(4);
  });

  it("handles empty items list", () => {
    const container = createMockContainer(800, 600, 0);
    const containerRef = { current: container };

    const { result } = renderHook(() =>
      useVirtualGrid({
        containerRef,
        totalItems: 0,
        itemWidth: 160,
      })
    );

    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(-1);
    expect(result.current.totalRows).toBe(0);
    expect(result.current.totalHeight).toBe(0);
  });

  it("scrollToIndex adjusts container scrollTop", () => {
    const container = createMockContainer(800, 600, 0);
    const containerRef = { current: container };

    const { result } = renderHook(() =>
      useVirtualGrid({
        containerRef,
        totalItems: 100,
        itemWidth: 160,
        estimatedItemHeight: 260,
      })
    );

    act(() => {
      result.current.scrollToIndex(40); // Row 10
    });

    expect(container.scrollTop).toBeGreaterThan(0);
  });

  it("expands visible item slice when overscanRows is set to HIGH_PERF_OVERSCAN_ROWS", () => {
    const container = createMockContainer(800, 600, 0);
    const containerRef = { current: container };

    const { result: normalResult } = renderHook(() =>
      useVirtualGrid({
        containerRef,
        totalItems: 100,
        itemWidth: 160,
        estimatedItemHeight: 260,
        overscanRows: 2,
      })
    );

    const { result: highPerfResult } = renderHook(() =>
      useVirtualGrid({
        containerRef,
        totalItems: 100,
        itemWidth: 160,
        estimatedItemHeight: 260,
        overscanRows: HIGH_PERF_OVERSCAN_ROWS,
      })
    );

    // With 8 overscan rows, endIndex should be significantly larger than with 2 overscan rows
    expect(highPerfResult.current.endIndex).toBeGreaterThan(normalResult.current.endIndex);
    // At top (startRow=0), with overscan=8, visible rows reach up to clampedLast (2) + 8 = 10 rows (40 items: 0..39)
    expect(highPerfResult.current.endIndex).toBe(43); // 0..10 rows = 11 rows * 4 - 1 = 43
  });
});
