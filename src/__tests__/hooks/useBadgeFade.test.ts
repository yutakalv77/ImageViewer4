import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBadgeFade } from "../../hooks/useBadgeFade";

describe("useBadgeFade hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("enabledがfalseの場合はhiddenになること", () => {
    const { result } = renderHook(() =>
      useBadgeFade({ triggerKey: 1, enabled: false })
    );

    expect(result.current.fadeState).toBe("hidden");
    expect(result.current.isVisible).toBe(false);
  });

  it("enabledがtrueになった時、activeになり、2秒後にfaded、4秒後にhiddenになること", () => {
    const { result } = renderHook(() =>
      useBadgeFade({
        triggerKey: 1,
        enabled: true,
        activeDurationMs: 2000,
        fadeDurationMs: 2000,
      })
    );

    // 操作直後は active (100%)
    expect(result.current.fadeState).toBe("active");
    expect(result.current.isVisible).toBe(true);

    // 2秒後 -> faded (半透明)
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.fadeState).toBe("faded");
    expect(result.current.isVisible).toBe(true);

    // さらに2秒後 (合計4秒) -> hidden (非表示)
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.fadeState).toBe("hidden");
    expect(result.current.isVisible).toBe(false);
  });

  it("fadedまたはhiddenの途中でtriggerKeyが更新された場合、activeにリセットされること", () => {
    let trigger = 1;
    const { result, rerender } = renderHook(
      ({ key }) =>
        useBadgeFade({
          triggerKey: key,
          enabled: true,
          activeDurationMs: 2000,
          fadeDurationMs: 2000,
        }),
      { initialProps: { key: trigger } }
    );

    // 2.5秒進めて faded にする
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(result.current.fadeState).toBe("faded");

    // 新たにズーム操作発生
    trigger = 2;
    rerender({ key: trigger });

    // active に復帰
    expect(result.current.fadeState).toBe("active");
  });

  it("マウスホバー時はタイマーが停止しactiveを維持すること", () => {
    const { result } = renderHook(() =>
      useBadgeFade({
        triggerKey: 1,
        enabled: true,
        activeDurationMs: 2000,
        fadeDurationMs: 2000,
      })
    );

    // 1秒進める
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // ホバー
    act(() => {
      result.current.handleMouseEnter();
    });
    expect(result.current.isHovered).toBe(true);
    expect(result.current.fadeState).toBe("active");

    // ホバー中に時間が経過しても active のまま
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.fadeState).toBe("active");

    // ホバー解除 -> 再びタイマー開始
    act(() => {
      result.current.handleMouseLeave();
    });
    expect(result.current.isHovered).toBe(false);

    // 2秒後 -> faded
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.fadeState).toBe("faded");
  });

  it("enabledが途中でfalseになったら即座にhiddenになること", () => {
    let isEnabled = true;
    const { result, rerender } = renderHook(
      ({ enabled }) =>
        useBadgeFade({
          triggerKey: 1,
          enabled,
          activeDurationMs: 2000,
          fadeDurationMs: 2000,
        }),
      { initialProps: { enabled: isEnabled } }
    );

    expect(result.current.fadeState).toBe("active");

    // ズームリセット等で enabled = false
    isEnabled = false;
    rerender({ enabled: isEnabled });

    expect(result.current.fadeState).toBe("hidden");
    expect(result.current.isVisible).toBe(false);
  });
});
