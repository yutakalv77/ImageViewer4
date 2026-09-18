import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useImageTransform } from "../../hooks/useImageTransform";

describe("useImageTransform", () => {
  it("initializes with default transform", () => {
    const { result } = renderHook(() => useImageTransform());
    expect(result.current.transform).toEqual({ rotation: 0, flipH: false, flipV: false });
    expect(result.current.isTransformed).toBe(false);
    expect(result.current.transformCount).toBe(0);
  });

  it("rotates clockwise", () => {
    const { result } = renderHook(() => useImageTransform());

    act(() => {
      result.current.rotateClockwise();
    });
    expect(result.current.transform.rotation).toBe(90);
    expect(result.current.isTransformed).toBe(true);
    expect(result.current.transformCount).toBe(1);

    act(() => {
      result.current.rotateClockwise();
    });
    expect(result.current.transform.rotation).toBe(180);

    act(() => {
      result.current.rotateClockwise();
    });
    expect(result.current.transform.rotation).toBe(270);

    act(() => {
      result.current.rotateClockwise();
    });
    expect(result.current.transform.rotation).toBe(0);
    expect(result.current.isTransformed).toBe(false);
  });

  it("rotates counter-clockwise", () => {
    const { result } = renderHook(() => useImageTransform());

    act(() => {
      result.current.rotateCounterClockwise();
    });
    expect(result.current.transform.rotation).toBe(270);
    expect(result.current.isTransformed).toBe(true);

    act(() => {
      result.current.rotateCounterClockwise();
    });
    expect(result.current.transform.rotation).toBe(180);
  });

  it("toggles horizontal and vertical flip", () => {
    const { result } = renderHook(() => useImageTransform());

    act(() => {
      result.current.toggleFlipH();
    });
    expect(result.current.transform.flipH).toBe(true);
    expect(result.current.isTransformed).toBe(true);

    act(() => {
      result.current.toggleFlipV();
    });
    expect(result.current.transform.flipV).toBe(true);
    expect(result.current.transform.flipH).toBe(true);

    act(() => {
      result.current.toggleFlipH();
    });
    expect(result.current.transform.flipH).toBe(false);
    expect(result.current.transform.flipV).toBe(true);
  });

  it("resets transform to initial state", () => {
    const { result } = renderHook(() => useImageTransform());

    act(() => {
      result.current.rotateClockwise();
      result.current.toggleFlipH();
      result.current.toggleFlipV();
    });
    expect(result.current.isTransformed).toBe(true);

    act(() => {
      result.current.resetTransform();
    });
    expect(result.current.transform).toEqual({ rotation: 0, flipH: false, flipV: false });
    expect(result.current.isTransformed).toBe(false);
  });
});
