import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScrollManager } from "../../hooks/useScrollManager";

describe("useScrollManager", () => {
  it("should initialize with default scroll target at 0", () => {
    const { result } = renderHook(() => useScrollManager());
    expect(result.current.scrollTarget).toEqual({ path: "", scrollTop: 0, id: 0 });
  });

  it("should always set scroll to 0 when opening a folder ('open')", () => {
    const { result } = renderHook(() => useScrollManager());

    act(() => {
      const targetScroll = result.current.prepareScrollForNavigation("C:/photos", "", "open");
      expect(targetScroll).toBe(0);
    });

    expect(result.current.scrollTarget.path).toBe("C:/photos");
    expect(result.current.scrollTarget.scrollTop).toBe(0);
  });

  it("should remember scroll position on scroll and restore on history back ('back')", () => {
    const { result } = renderHook(() => useScrollManager());

    // 1. Open folder A
    act(() => {
      result.current.prepareScrollForNavigation("C:/photos/A", "", "open");
    });
    expect(result.current.scrollTarget.scrollTop).toBe(0);

    // 2. User scrolls in folder A to 450px
    act(() => {
      result.current.saveScrollPosition("C:/photos/A", 450);
    });
    expect(result.current.getSavedScrollPosition("C:/photos/A")).toBe(450);

    // 3. Open subfolder B (must be at top 0)
    act(() => {
      const targetScroll = result.current.prepareScrollForNavigation("C:/photos/A/B", "C:/photos/A", "open");
      expect(targetScroll).toBe(0);
    });
    expect(result.current.scrollTarget.scrollTop).toBe(0);

    // 4. User scrolls in subfolder B to 120px
    act(() => {
      result.current.saveScrollPosition("C:/photos/A/B", 120);
    });

    // 5. Navigate back to folder A ('back')
    act(() => {
      const targetScroll = result.current.prepareScrollForNavigation("C:/photos/A", "C:/photos/A/B", "back");
      expect(targetScroll).toBe(450);
    });
    expect(result.current.scrollTarget.scrollTop).toBe(450);
  });

  it("should restore remembered scroll position when navigating up to parent ('up'), or 0 if no memory", () => {
    const { result } = renderHook(() => useScrollManager());

    // Case 1: Parent folder was scrolled and remembered
    act(() => {
      result.current.prepareScrollForNavigation("C:/photos", "", "open");
      result.current.saveScrollPosition("C:/photos", 600);
      result.current.prepareScrollForNavigation("C:/photos/album1", "C:/photos", "open");
    });

    // Navigate to parent folder
    act(() => {
      const targetScroll = result.current.prepareScrollForNavigation("C:/photos", "C:/photos/album1", "up");
      expect(targetScroll).toBe(600);
    });
    expect(result.current.scrollTarget.scrollTop).toBe(600);
    expect(result.current.scrollTarget.targetEntryPath).toBe("C:/photos/album1");

    // Case 2: Parent folder has no saved scroll position -> should be 0 (top)
    act(() => {
      const targetScroll = result.current.prepareScrollForNavigation("C:/other_parent", "C:/photos", "up");
      expect(targetScroll).toBe(0);
    });
    expect(result.current.scrollTarget.scrollTop).toBe(0);
    expect(result.current.scrollTarget.targetEntryPath).toBe("C:/photos");
  });

  it("1階層上の親ディレクトリへ通常オープン（パンくずリスト等）で遷移した場合でも targetEntryPath が設定されること", () => {
    const { result } = renderHook(() => useScrollManager());

    act(() => {
      result.current.prepareScrollForNavigation("C:/Photos", "C:/Photos/Trip2024", "open");
    });

    expect(result.current.scrollTarget.targetEntryPath).toBe("C:/Photos/Trip2024");
  });

  it("should reset scroll position to 0 if a folder is opened anew even if previously saved", () => {
    const { result } = renderHook(() => useScrollManager());

    // 1. Open and scroll folder A to 500px
    act(() => {
      result.current.prepareScrollForNavigation("C:/photos", "", "open");
      result.current.saveScrollPosition("C:/photos", 500);
    });
    expect(result.current.getSavedScrollPosition("C:/photos")).toBe(500);

    // 2. Open another folder
    act(() => {
      result.current.prepareScrollForNavigation("C:/music", "C:/photos", "open");
    });

    // 3. User explicitly opens C:/photos anew ('open')
    act(() => {
      const targetScroll = result.current.prepareScrollForNavigation("C:/photos", "C:/music", "open");
      expect(targetScroll).toBe(0);
    });
    expect(result.current.scrollTarget.scrollTop).toBe(0);
    expect(result.current.getSavedScrollPosition("C:/photos")).toBe(0);
  });

  it("should normalize path separators so Windows backslashes and slashes match", () => {
    const { result } = renderHook(() => useScrollManager());

    act(() => {
      result.current.saveScrollPosition("C:\\photos\\sub", 300);
    });

    // Query with forward slash
    expect(result.current.getSavedScrollPosition("C:/photos/sub")).toBe(300);

    // Navigate back with forward slash
    act(() => {
      const targetScroll = result.current.prepareScrollForNavigation("C:/photos/sub", "C:/other", "back");
      expect(targetScroll).toBe(300);
    });
  });

  it("should handle trailing slashes and case insensitivity seamlessly", () => {
    const { result } = renderHook(() => useScrollManager());

    act(() => {
      result.current.saveScrollPosition("C:/Photos/Vacation/", 400);
    });

    // Query without trailing slash and different casing
    expect(result.current.getSavedScrollPosition("c:/photos/vacation")).toBe(400);

    act(() => {
      const targetScroll = result.current.prepareScrollForNavigation("C:\\photos\\vacation", "C:/other", "back");
      expect(targetScroll).toBe(400);
    });
  });

  it("should preserve virtual paths as distinct keys without lowercasing query", () => {
    const { result } = renderHook(() => useScrollManager());

    act(() => {
      result.current.saveScrollPosition("virtual:search?q=SpecialFolder", 150);
    });

    expect(result.current.getSavedScrollPosition("virtual:search?q=SpecialFolder")).toBe(150);
  });

  it("should maintain scroll position when reloading the same path", () => {
    const { result } = renderHook(() => useScrollManager());

    act(() => {
      result.current.saveScrollPosition("C:/photos", 250);
      const targetScroll = result.current.prepareScrollForNavigation("C:/photos", "C:/photos", "open");
      expect(targetScroll).toBe(250);
    });
    expect(result.current.scrollTarget.scrollTop).toBe(250);
  });
});
