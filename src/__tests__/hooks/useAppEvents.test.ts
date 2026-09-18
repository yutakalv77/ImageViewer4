import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAppEvents } from "../../hooks/useAppEvents";

describe("useAppEvents hook", () => {
  const createMockHandlers = () => ({
    closeViewer: vi.fn(),
    onLoadDirectory: vi.fn(),
    onGoUp: vi.fn(),
    onGoBack: vi.fn(),
    onGoForward: vi.fn(),
    onUpdateViewMode: vi.fn(),
    onSetIsSettingsOpen: vi.fn(),
    onSetIsFavoritesOpen: vi.fn(),
    onSetIsIntervalDialogOpen: vi.fn(),
  });

  const defaultState = {
    isViewerOpen: false,
    viewMode: "single" as const,
    isSettingsOpen: false,
    isFavoritesOpen: false,
    isIntervalDialogOpen: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ギャラリー表示時、Backspaceキーで onGoUp が呼ばれること", () => {
    const handlers = createMockHandlers();
    renderHook(() => useAppEvents(handlers, defaultState));

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace" }));
    });

    expect(handlers.onGoUp).toHaveBeenCalledTimes(1);
  });

  it("ギャラリー表示時、input要素フォーカス中（リネーム中等）はBackspaceキーで onGoUp が呼ばれないこと", () => {
    const handlers = createMockHandlers();
    renderHook(() => useAppEvents(handlers, defaultState));

    const input = document.createElement("input");
    document.body.appendChild(input);

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "Backspace", bubbles: true });
      input.dispatchEvent(event);
    });

    expect(handlers.onGoUp).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("ビューワー表示時、Backspaceキーで closeViewer が呼ばれること", () => {
    const handlers = createMockHandlers();
    renderHook(() =>
      useAppEvents(handlers, { ...defaultState, isViewerOpen: true })
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace" }));
    });

    expect(handlers.closeViewer).toHaveBeenCalledTimes(1);
  });

  it("ビューワー表示時、input要素フォーカス中（リネームダイアログ等）はBackspaceキーで closeViewer が呼ばれないこと", () => {
    const handlers = createMockHandlers();
    renderHook(() =>
      useAppEvents(handlers, { ...defaultState, isViewerOpen: true })
    );

    const input = document.createElement("input");
    document.body.appendChild(input);

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "Backspace", bubbles: true });
      input.dispatchEvent(event);
    });

    expect(handlers.closeViewer).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("input要素フォーカス中はEscapeキーでも onGoUp や closeViewer が呼ばれないこと", () => {
    const handlers = createMockHandlers();
    renderHook(() => useAppEvents(handlers, defaultState));

    const input = document.createElement("input");
    document.body.appendChild(input);

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
      input.dispatchEvent(event);
    });

    expect(handlers.onGoUp).not.toHaveBeenCalled();
    expect(handlers.closeViewer).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });
});
