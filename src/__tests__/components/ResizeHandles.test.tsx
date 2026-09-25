import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResizeHandles } from "../../components/ResizeHandles";
import * as useWindowModule from "../../hooks/useWindow";

describe("ResizeHandles", () => {
  const mockStartResizing = vi.fn();
  const mockToggleVerticalMaximize = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useWindowModule, "useWindow").mockReturnValue({
      startResizing: mockStartResizing,
      toggleVerticalMaximize: mockToggleVerticalMaximize,
    } as any);
  });

  it("すべてのリサイズハンドルが正しく描画されること", () => {
    render(<ResizeHandles />);

    expect(screen.getByTestId("resize-handle-n")).toBeInTheDocument();
    expect(screen.getByTestId("resize-handle-s")).toBeInTheDocument();
    expect(screen.getByTestId("resize-handle-e")).toBeInTheDocument();
    expect(screen.getByTestId("resize-handle-w")).toBeInTheDocument();
    expect(screen.getByTestId("resize-handle-nw")).toBeInTheDocument();
    expect(screen.getByTestId("resize-handle-ne")).toBeInTheDocument();
    expect(screen.getByTestId("resize-handle-sw")).toBeInTheDocument();
    expect(screen.getByTestId("resize-handle-se")).toBeInTheDocument();
  });

  it("上辺（n）のマウスダウン後ドラッグ移動で startResizing('North') が呼ばれ、ダブルクリックで toggleVerticalMaximize が呼ばれること", () => {
    render(<ResizeHandles />);
    const northHandle = screen.getByTestId("resize-handle-n");

    // 1. ドラッグ操作（mousedown -> mousemove 3px以上）
    fireEvent.mouseDown(northHandle, { button: 0, clientX: 100, clientY: 100 });
    expect(mockStartResizing).not.toHaveBeenCalled();

    fireEvent.mouseMove(window, { clientX: 104, clientY: 100 });
    expect(mockStartResizing).toHaveBeenCalledWith("North");

    // 2. ダブルクリックイベント発火
    fireEvent.doubleClick(northHandle, { button: 0 });
    expect(mockToggleVerticalMaximize).toHaveBeenCalledTimes(1);
  });

  it("下辺（s）のダブルクリックで toggleVerticalMaximize が呼ばれること", () => {
    render(<ResizeHandles />);
    const southHandle = screen.getByTestId("resize-handle-s");

    fireEvent.doubleClick(southHandle, { button: 0 });
    expect(mockToggleVerticalMaximize).toHaveBeenCalledTimes(1);
  });

  it("東辺・西辺・四隅のダブルクリックでは toggleVerticalMaximize が呼ばれないこと", () => {
    render(<ResizeHandles />);

    const otherHandles = [
      screen.getByTestId("resize-handle-e"),
      screen.getByTestId("resize-handle-w"),
      screen.getByTestId("resize-handle-nw"),
      screen.getByTestId("resize-handle-ne"),
      screen.getByTestId("resize-handle-sw"),
      screen.getByTestId("resize-handle-se"),
    ];

    otherHandles.forEach((handle) => {
      fireEvent.doubleClick(handle, { button: 0 });
    });

    expect(mockToggleVerticalMaximize).not.toHaveBeenCalled();
  });

  it("左クリック以外のマウスダウン（右クリック等）では startResizing が呼ばれないこと", () => {
    render(<ResizeHandles />);
    const northHandle = screen.getByTestId("resize-handle-n");

    fireEvent.mouseDown(northHandle, { button: 2, detail: 1 });
    expect(mockStartResizing).not.toHaveBeenCalled();
  });
});
