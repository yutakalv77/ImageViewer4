import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDraggableModal } from "../../hooks/useDraggableModal";

describe("useDraggableModal", () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1200 });
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 800 });
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: originalInnerWidth });
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: originalInnerHeight });
  });

  it("isOpenがtrueのとき、画面中央に初期配置されること", () => {
    const { result } = renderHook(() =>
      useDraggableModal({
        initialSize: { w: 600, h: 400 },
        isOpen: true,
      })
    );

    // x = (1200 - 600) / 2 = 300, y = (800 - 400) / 2 = 200
    expect(result.current.pos).toEqual({ x: 300, y: 200 });
    expect(result.current.size).toEqual({ w: 600, h: 400 });
  });

  it("ドラッグ操作により位置が正しく更新されること", () => {
    const { result } = renderHook(() =>
      useDraggableModal({
        initialSize: { w: 600, h: 400 },
        isOpen: true,
      })
    );

    // マウスダウン（ドラッグ開始）
    act(() => {
      result.current.handleMouseDown({
        clientX: 350,
        clientY: 220,
      } as React.MouseEvent);
    });

    // マウス移動 (+50px, +30px)
    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 400, clientY: 250 }));
    });

    expect(result.current.pos).toEqual({ x: 350, y: 230 });

    // マウスアップ（ドラッグ終了）
    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"));
    });

    // ドロップ後のマウス移動で位置が変わらないこと
    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 500, clientY: 300 }));
    });
    expect(result.current.pos).toEqual({ x: 350, y: 230 });

    // 画面上部外（y < 0）へのドラッグ時は y=0 にクランプされること
    act(() => {
      result.current.handleMouseDown({
        clientX: 350,
        clientY: 230,
      } as React.MouseEvent);
    });
    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 350, clientY: -100 }));
    });
    expect(result.current.pos.y).toBe(0);

    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"));
    });
  });

  it("リサイズ操作によりサイズが更新され、minSize制約が働くこと", () => {
    const { result } = renderHook(() =>
      useDraggableModal({
        initialSize: { w: 600, h: 400 },
        minSize: { w: 400, h: 300 },
        isOpen: true,
      })
    );

    // 右下リサイズ開始
    act(() => {
      result.current.handleResizeStart(
        {
          clientX: 900,
          clientY: 600,
          stopPropagation: () => {},
        } as unknown as React.MouseEvent,
        "se"
      );
    });

    // +100px 拡大
    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 1000, clientY: 700 }));
    });

    expect(result.current.size).toEqual({ w: 700, h: 500 });

    // 縮小（minSize未満に縮小しようとした場合）
    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 500, clientY: 400 }));
    });

    // minSize に制限されること
    expect(result.current.size).toEqual({ w: 400, h: 300 });

    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"));
    });
  });
});
