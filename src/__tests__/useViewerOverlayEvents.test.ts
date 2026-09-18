import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useViewerOverlayEvents } from "../hooks/useViewerOverlayEvents";
import { DOUBLE_CLICK_DELAY_MS } from "../utils/zoomPanUtils";

describe("useViewerOverlayEvents", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createDefaultOptions = () => ({
    isMagnifierActive: false,
    isZoomed: false,
    hasDragged: false,
    clearHasDragged: vi.fn(),
    onClose: vi.fn(),
    onNext: vi.fn(),
    onPrev: vi.fn(),
    magnifier: {
      handleWheel: vi.fn().mockReturnValue(false),
      handleMouseMove: vi.fn(),
    },
    zoomPan: {
      handleWheel: vi.fn().mockReturnValue(false),
      handleMouseMove: vi.fn(),
      handleDoubleClick: vi.fn(),
    },
  });

  it("オーバーレイのシングルクリック時、DOUBLE_CLICK_DELAY_MS 経過後に onClose が呼ばれること", () => {
    const opts = createDefaultOptions();
    const { result } = renderHook(() => useViewerOverlayEvents(opts));

    act(() => {
      result.current.handleOverlayClick();
    });

    expect(opts.onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(DOUBLE_CLICK_DELAY_MS);
    });

    expect(opts.onClose).toHaveBeenCalledTimes(1);
  });

  it("ダブルクリックが発生した場合、シングルクリックのタイマーがキャンセルされ onClose は呼ばれないこと", () => {
    const opts = createDefaultOptions();
    const { result } = renderHook(() => useViewerOverlayEvents(opts));

    act(() => {
      result.current.handleOverlayClick();
    });

    const fakeEvent = {
      button: 0,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent<HTMLDivElement>;

    act(() => {
      result.current.handleOverlayDoubleClick(fakeEvent);
    });

    expect(opts.zoomPan.handleDoubleClick).toHaveBeenCalledWith(fakeEvent);

    act(() => {
      vi.advanceTimersByTime(DOUBLE_CLICK_DELAY_MS + 100);
    });

    // タイマーがキャンセルされたため onClose は呼ばれない
    expect(opts.onClose).not.toHaveBeenCalled();
  });

  it("hasDragged が true の場合、クリックでドラッグフラグのみクリアされ onClose は呼ばれないこと", () => {
    const opts = { ...createDefaultOptions(), hasDragged: true };
    const { result } = renderHook(() => useViewerOverlayEvents(opts));

    act(() => {
      result.current.handleOverlayClick();
    });

    expect(opts.clearHasDragged).toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(DOUBLE_CLICK_DELAY_MS);
    });

    expect(opts.onClose).not.toHaveBeenCalled();
  });

  it("isZoomed が true の場合、クリックしても onClose は呼ばれないこと", () => {
    const opts = { ...createDefaultOptions(), isZoomed: true };
    const { result } = renderHook(() => useViewerOverlayEvents(opts));

    act(() => {
      result.current.handleOverlayClick();
    });

    act(() => {
      vi.advanceTimersByTime(DOUBLE_CLICK_DELAY_MS);
    });

    expect(opts.onClose).not.toHaveBeenCalled();
  });

  it("マウス移動時に magnifier と zoomPan の両方のハンドラーが呼ばれること", () => {
    const opts = createDefaultOptions();
    const { result } = renderHook(() => useViewerOverlayEvents(opts));

    const fakeMoveEvent = {} as React.MouseEvent<HTMLDivElement>;
    result.current.handleMouseMove(fakeMoveEvent);

    expect(opts.magnifier.handleMouseMove).toHaveBeenCalledWith(fakeMoveEvent);
    expect(opts.zoomPan.handleMouseMove).toHaveBeenCalledWith(fakeMoveEvent);
  });

  it("ホイール操作で onNext / onPrev が呼ばれること", () => {
    const opts = createDefaultOptions();
    const { result } = renderHook(() => useViewerOverlayEvents(opts));

    const fakeNextWheel = { deltaY: 50 } as React.WheelEvent<HTMLDivElement>;
    act(() => {
      result.current.handleWheel(fakeNextWheel);
    });
    expect(opts.onNext).toHaveBeenCalledTimes(1);

    // クールダウン経過後
    vi.advanceTimersByTime(500);

    const fakePrevWheel = { deltaY: -50 } as React.WheelEvent<HTMLDivElement>;
    act(() => {
      result.current.handleWheel(fakePrevWheel);
    });
    expect(opts.onPrev).toHaveBeenCalledTimes(1);
  });

  it("高速ホイール操作時、60ms以上の間隔で連続して onNext が呼ばれること（キーボード並みの高速切り替え）", () => {
    const opts = createDefaultOptions();
    const { result } = renderHook(() => useViewerOverlayEvents(opts));

    const fakeWheel = { deltaY: 100 } as React.WheelEvent<HTMLDivElement>;

    // 1回目の操作
    act(() => {
      result.current.handleWheel(fakeWheel);
    });
    expect(opts.onNext).toHaveBeenCalledTimes(1);

    // クールダウン未満（30ms）では追加入力は無視される
    act(() => {
      vi.advanceTimersByTime(30);
      result.current.handleWheel(fakeWheel);
    });
    expect(opts.onNext).toHaveBeenCalledTimes(1);

    // クールダウン経過（さらに 40ms 経過、合計 70ms）で次の遷移が即座に発火
    act(() => {
      vi.advanceTimersByTime(40);
      result.current.handleWheel(fakeWheel);
    });
    expect(opts.onNext).toHaveBeenCalledTimes(2);

    // さらに 70ms 経過で3回目の遷移が発火
    act(() => {
      vi.advanceTimersByTime(70);
      result.current.handleWheel(fakeWheel);
    });
    expect(opts.onNext).toHaveBeenCalledTimes(3);
  });
});

