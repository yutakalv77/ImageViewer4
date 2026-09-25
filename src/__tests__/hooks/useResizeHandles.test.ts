import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useResizeHandles } from "../../hooks/useResizeHandles";

describe("useResizeHandles", () => {
  const onStartResizing = vi.fn();
  const onVerticalDoubleClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("マウスダウン後にドラッグ閾値（3px）以上動いた場合、onStartResizing が呼ばれること", () => {
    const { result } = renderHook(() =>
      useResizeHandles({ onStartResizing, onVerticalDoubleClick })
    );

    const mockElement = { dataset: { direction: "North" } } as any;

    act(() => {
      result.current.handleMouseDown({
        button: 0,
        clientX: 100,
        clientY: 100,
        currentTarget: mockElement,
      } as any);
    });

    expect(onStartResizing).not.toHaveBeenCalled();

    // 閾値未満（2px）の移動
    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 102, clientY: 100 }));
    });
    expect(onStartResizing).not.toHaveBeenCalled();

    // 閾値（3px）以上の移動 -> ドラッグリサイズ開始
    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 103, clientY: 100 }));
    });
    expect(onStartResizing).toHaveBeenCalledWith("North");

    // ボタンを離してもダブルクリック判定は発火しないこと
    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"));
    });
    expect(onVerticalDoubleClick).not.toHaveBeenCalled();
  });

  it("上辺（North）でドラッグせずに2回連続でクリックされた場合、onVerticalDoubleClick が呼ばれること", () => {
    const { result } = renderHook(() =>
      useResizeHandles({ onStartResizing, onVerticalDoubleClick })
    );

    const mockElement = { dataset: { direction: "North" } } as any;

    // 1回目のクリック
    act(() => {
      result.current.handleMouseDown({
        button: 0,
        clientX: 100,
        clientY: 100,
        currentTarget: mockElement,
      } as any);
      window.dispatchEvent(new MouseEvent("mouseup"));
    });

    expect(onStartResizing).not.toHaveBeenCalled();
    expect(onVerticalDoubleClick).not.toHaveBeenCalled();

    // 150ms 後に 2回目のクリック
    act(() => {
      vi.advanceTimersByTime(150);
      result.current.handleMouseDown({
        button: 0,
        clientX: 100,
        clientY: 100,
        currentTarget: mockElement,
      } as any);
      window.dispatchEvent(new MouseEvent("mouseup"));
    });

    expect(onVerticalDoubleClick).toHaveBeenCalledTimes(1);
    expect(onStartResizing).not.toHaveBeenCalled();
  });

  it("下辺（South）で2回連続でクリックされた場合も、onVerticalDoubleClick が呼ばれること", () => {
    const { result } = renderHook(() =>
      useResizeHandles({ onStartResizing, onVerticalDoubleClick })
    );

    const mockElement = { dataset: { direction: "South" } } as any;

    // 1回目
    act(() => {
      result.current.handleMouseDown({
        button: 0,
        clientX: 100,
        clientY: 500,
        currentTarget: mockElement,
      } as any);
      window.dispatchEvent(new MouseEvent("mouseup"));
    });

    // 2回目（200ms後）
    act(() => {
      vi.advanceTimersByTime(200);
      result.current.handleMouseDown({
        button: 0,
        clientX: 100,
        clientY: 500,
        currentTarget: mockElement,
      } as any);
      window.dispatchEvent(new MouseEvent("mouseup"));
    });

    expect(onVerticalDoubleClick).toHaveBeenCalledTimes(1);
  });

  it("400ms を超えて間隔が空いた2回のクリックでは onVerticalDoubleClick が呼ばれないこと", () => {
    const { result } = renderHook(() =>
      useResizeHandles({ onStartResizing, onVerticalDoubleClick })
    );

    const mockElement = { dataset: { direction: "North" } } as any;

    // 1回目
    act(() => {
      result.current.handleMouseDown({
        button: 0,
        clientX: 100,
        clientY: 100,
        currentTarget: mockElement,
      } as any);
      window.dispatchEvent(new MouseEvent("mouseup"));
    });

    // 450ms 経過（doubleClickDelay 超過）
    act(() => {
      vi.advanceTimersByTime(450);
      result.current.handleMouseDown({
        button: 0,
        clientX: 100,
        clientY: 100,
        currentTarget: mockElement,
      } as any);
      window.dispatchEvent(new MouseEvent("mouseup"));
    });

    expect(onVerticalDoubleClick).not.toHaveBeenCalled();
  });

  it("Eastなどの他の辺でダブルクリックしても onVerticalDoubleClick は呼ばれないこと", () => {
    const { result } = renderHook(() =>
      useResizeHandles({ onStartResizing, onVerticalDoubleClick })
    );

    const mockElement = { dataset: { direction: "East" } } as any;

    act(() => {
      result.current.handleMouseDown({
        button: 0,
        clientX: 800,
        clientY: 300,
        currentTarget: mockElement,
      } as any);
      window.dispatchEvent(new MouseEvent("mouseup"));
    });

    act(() => {
      vi.advanceTimersByTime(100);
      result.current.handleMouseDown({
        button: 0,
        clientX: 800,
        clientY: 300,
        currentTarget: mockElement,
      } as any);
      window.dispatchEvent(new MouseEvent("mouseup"));
    });

    expect(onVerticalDoubleClick).not.toHaveBeenCalled();
  });

  it("handleDoubleClick（ブラウザネイティブの dblclick イベント）でも正しく動作し重複実行されないこと", () => {
    const { result } = renderHook(() =>
      useResizeHandles({ onStartResizing, onVerticalDoubleClick })
    );

    const mockElement = { dataset: { direction: "North" } } as any;
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();

    // 1. handleDoubleClick 単体実行
    act(() => {
      result.current.handleDoubleClick({
        button: 0,
        currentTarget: mockElement,
        preventDefault,
        stopPropagation,
      } as any);
    });

    expect(onVerticalDoubleClick).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();

    // 直後の呼び出し（重複イベント）は防止されること
    act(() => {
      result.current.handleDoubleClick({
        button: 0,
        currentTarget: mockElement,
        preventDefault,
        stopPropagation,
      } as any);
    });

    expect(onVerticalDoubleClick).toHaveBeenCalledTimes(1);
  });
});
