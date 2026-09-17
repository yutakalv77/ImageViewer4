import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMagnifier } from "../hooks/useMagnifier";

describe("useMagnifier hook", () => {
  const mockContainerRef = {
    current: document.createElement("div"),
  };

  it("初期状態が正しく設定されていること", () => {
    const { result } = renderHook(() => useMagnifier(mockContainerRef));

    expect(result.current.isMagnifierActive).toBe(false);
    expect(result.current.zoom).toBe(2.5);
    expect(result.current.lensSize).toBe(240);
  });

  it("toggleMagnifier で状態がトグルされること", () => {
    const { result } = renderHook(() => useMagnifier(mockContainerRef));

    act(() => {
      result.current.toggleMagnifier();
    });
    expect(result.current.isMagnifierActive).toBe(true);

    act(() => {
      result.current.toggleMagnifier();
    });
    expect(result.current.isMagnifierActive).toBe(false);
  });

  it("zoomIn / zoomOut で倍率が変更されること", () => {
    const { result } = renderHook(() => useMagnifier(mockContainerRef));

    act(() => {
      result.current.zoomIn();
    });
    expect(result.current.zoom).toBe(3.0);

    act(() => {
      result.current.zoomOut();
    });
    expect(result.current.zoom).toBe(2.5);
  });

  it("increaseLensSize / decreaseLensSize でサイズが変更されること", () => {
    const { result } = renderHook(() => useMagnifier(mockContainerRef));

    act(() => {
      result.current.increaseLensSize();
    });
    expect(result.current.lensSize).toBe(260);

    act(() => {
      result.current.decreaseLensSize();
    });
    expect(result.current.lensSize).toBe(240);
  });

  it("handleWheel: 非アクティブ時はホイール処理をスキップ（false返却）すること", () => {
    const { result } = renderHook(() => useMagnifier(mockContainerRef));

    const mockEvent = {
      ctrlKey: true,
      deltaY: -100,
      preventDefault: () => {},
      stopPropagation: () => {},
    } as any;

    let handled = false;
    act(() => {
      handled = result.current.handleWheel(mockEvent);
    });

    expect(handled).toBe(false);
  });

  it("handleWheel: Ctrl+Wheel でズーム倍率が変更され true を返すこと", () => {
    const { result } = renderHook(() => useMagnifier(mockContainerRef));

    act(() => {
      result.current.setMagnifierActive(true);
    });

    const mockEvent = {
      ctrlKey: true,
      deltaY: -100,
      preventDefault: () => {},
      stopPropagation: () => {},
    } as any;

    let handled = false;
    act(() => {
      handled = result.current.handleWheel(mockEvent);
    });

    expect(handled).toBe(true);
    expect(result.current.zoom).toBe(3.0);
  });

  it("handleWheel: Shift+Wheel でレンズサイズが変更され true を返すこと", () => {
    const { result } = renderHook(() => useMagnifier(mockContainerRef));

    act(() => {
      result.current.setMagnifierActive(true);
    });

    const mockEvent = {
      shiftKey: true,
      deltaY: -100,
      preventDefault: () => {},
      stopPropagation: () => {},
    } as any;

    let handled = false;
    act(() => {
      handled = result.current.handleWheel(mockEvent);
    });

    expect(handled).toBe(true);
    expect(result.current.lensSize).toBe(260);
  });

  it("resetActiveImage で画像情報がリセットされること", () => {
    const { result } = renderHook(() => useMagnifier(mockContainerRef));

    act(() => {
      result.current.resetActiveImage();
    });

    expect(result.current.activeImageSrc).toBeNull();
    expect(result.current.activeImageRect).toBeNull();
  });
});
