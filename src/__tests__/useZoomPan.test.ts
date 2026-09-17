import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useZoomPan } from "../hooks/useZoomPan";

describe("useZoomPan", () => {
  const createMockContainer = (width = 1000, height = 800) => {
    const el = document.createElement("div");
    el.getBoundingClientRect = () => ({
      width,
      height,
      top: 0,
      left: 0,
      bottom: height,
      right: width,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    return { current: el };
  };

  it("初期状態が正しく設定されていること", () => {
    const containerRef = createMockContainer();
    const { result } = renderHook(() => useZoomPan({ containerRef }));

    expect(result.current.scale).toBe(1.0);
    expect(result.current.offset).toEqual({ x: 0, y: 0 });
    expect(result.current.isZoomed).toBe(false);
    expect(result.current.isDragging).toBe(false);
    expect(result.current.hasDragged).toBe(false);
  });

  it("zoomInでズームインし、zoomOutでズームアウトすること", () => {
    const containerRef = createMockContainer();
    const { result } = renderHook(() => useZoomPan({ containerRef }));

    act(() => {
      result.current.zoomIn();
    });
    expect(result.current.scale).toBe(1.25);
    expect(result.current.isZoomed).toBe(true);

    act(() => {
      result.current.zoomOut();
    });
    expect(result.current.scale).toBe(1.0);
    expect(result.current.isZoomed).toBe(false);
  });

  it("resetZoomでスケールとオフセットがリセットされること", () => {
    const containerRef = createMockContainer();
    const { result } = renderHook(() => useZoomPan({ containerRef }));

    act(() => {
      result.current.zoomIn();
    });
    expect(result.current.scale).toBeGreaterThan(1.0);

    act(() => {
      result.current.resetZoom();
    });
    expect(result.current.scale).toBe(1.0);
    expect(result.current.offset).toEqual({ x: 0, y: 0 });
  });

  it("activeKeyが変更されたときに自動的にズームがリセットされること", () => {
    const containerRef = createMockContainer();
    let activeKey = 0;
    const { result, rerender } = renderHook(
      ({ key }) => useZoomPan({ containerRef, activeKey: key }),
      { initialProps: { key: activeKey } }
    );

    act(() => {
      result.current.zoomIn();
    });
    expect(result.current.scale).toBe(1.25);

    // 画像切り替え
    activeKey = 1;
    rerender({ key: activeKey });
    expect(result.current.scale).toBe(1.0);
  });

  it("ダブルクリックで2.0xにズームインし、再度ダブルクリックでリセットされること", () => {
    const containerRef = createMockContainer();
    const { result } = renderHook(() => useZoomPan({ containerRef }));

    const mockEvent = {
      button: 0,
      clientX: 500,
      clientY: 400,
      preventDefault: () => {},
      stopPropagation: () => {},
    } as any;

    act(() => {
      result.current.handleDoubleClick(mockEvent);
    });
    expect(result.current.scale).toBe(2.0);
    expect(result.current.isZoomed).toBe(true);

    act(() => {
      result.current.handleDoubleClick(mockEvent);
    });
    expect(result.current.scale).toBe(1.0);
    expect(result.current.isZoomed).toBe(false);
  });

  it("ドラッグ移動によってoffsetが更新されhasDraggedがtrueになること", () => {
    const containerRef = createMockContainer();
    const { result } = renderHook(() => useZoomPan({ containerRef }));

    // まず2.0xにズーム
    act(() => {
      result.current.zoomIn();
      result.current.zoomIn();
    });

    // mousedown
    act(() => {
      result.current.handleMouseDown({
        button: 0,
        clientX: 100,
        clientY: 100,
        preventDefault: () => {},
      } as any);
    });
    expect(result.current.isDragging).toBe(true);

    // mousemove (10px移動)
    act(() => {
      result.current.handleMouseMove({
        clientX: 110,
        clientY: 115,
      } as any);
    });
    expect(result.current.hasDragged).toBe(true);
    expect(result.current.offset.x).toBe(10);
    expect(result.current.offset.y).toBe(15);

    // mouseup
    act(() => {
      result.current.handleMouseUp({} as any);
    });
    expect(result.current.isDragging).toBe(false);
  });
});
