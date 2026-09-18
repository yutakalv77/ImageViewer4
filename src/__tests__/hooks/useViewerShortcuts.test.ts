import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useViewerShortcuts, processViewerKeyDown, ViewerShortcutActions } from "../../hooks/useViewerShortcuts";

describe("useViewerShortcuts and processViewerKeyDown", () => {
  let actions: ViewerShortcutActions;

  beforeEach(() => {
    actions = {
      handleNext: vi.fn(),
      handlePrev: vi.fn(),
      onOpenRename: vi.fn(),
      onDelete: vi.fn(),
      onClose: vi.fn(),
      magnifier: {
        isMagnifierActive: false,
        toggleMagnifier: vi.fn(),
        setMagnifierActive: vi.fn(),
        zoomIn: vi.fn(),
        zoomOut: vi.fn(),
        increaseLensSize: vi.fn(),
        decreaseLensSize: vi.fn(),
      },
      zoomPan: {
        isZoomed: false,
        resetZoom: vi.fn(),
        toggleActualSize: vi.fn(),
        zoomIn: vi.fn(),
        zoomOut: vi.fn(),
      },
      transform: {
        isTransformed: false,
        resetTransform: vi.fn(),
        rotateClockwise: vi.fn(),
        rotateCounterClockwise: vi.fn(),
        toggleFlipH: vi.fn(),
        toggleFlipV: vi.fn(),
      },
    };
  });

  const createFakeEvent = (overrides: Partial<KeyboardEvent> = {}) => ({
    key: "",
    code: "",
    altKey: false,
    ctrlKey: false,
    shiftKey: false,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...overrides,
  });

  it("ArrowRight と ArrowLeft のナビゲーションが読書方向に応じて動作すること", () => {
    // RTL: ArrowLeft is next, ArrowRight is prev
    processViewerKeyDown(createFakeEvent({ key: "ArrowLeft" }), {
      readingDirection: "rtl",
      canRename: true,
      canDelete: true,
      actions,
    });
    expect(actions.handleNext).toHaveBeenCalledTimes(1);

    processViewerKeyDown(createFakeEvent({ key: "ArrowRight" }), {
      readingDirection: "rtl",
      canRename: true,
      canDelete: true,
      actions,
    });
    expect(actions.handlePrev).toHaveBeenCalledTimes(1);

    // LTR: ArrowRight is next, ArrowLeft is prev
    processViewerKeyDown(createFakeEvent({ key: "ArrowRight" }), {
      readingDirection: "ltr",
      canRename: true,
      canDelete: true,
      actions,
    });
    expect(actions.handleNext).toHaveBeenCalledTimes(2);
  });

  it("スペースキーで次に進むこと", () => {
    processViewerKeyDown(createFakeEvent({ key: " " }), {
      readingDirection: "ltr",
      canRename: true,
      canDelete: true,
      actions,
    });
    expect(actions.handleNext).toHaveBeenCalledTimes(1);
  });

  it("F2 でリネーム、Delete で削除が呼ばれること", () => {
    processViewerKeyDown(createFakeEvent({ key: "F2" }), {
      readingDirection: "ltr",
      canRename: true,
      canDelete: true,
      actions,
    });
    expect(actions.onOpenRename).toHaveBeenCalledTimes(1);

    processViewerKeyDown(createFakeEvent({ key: "Delete" }), {
      readingDirection: "ltr",
      canRename: true,
      canDelete: true,
      actions,
    });
    expect(actions.onDelete).toHaveBeenCalledTimes(1);
  });

  it("Escapeキーで拡大鏡、ズーム、変形、クローズが優先度順に実行されること", () => {
    // 拡大鏡アクティブ時
    actions.magnifier.isMagnifierActive = true;
    processViewerKeyDown(createFakeEvent({ key: "Escape" }), {
      readingDirection: "ltr",
      canRename: true,
      canDelete: true,
      actions,
    });
    expect(actions.magnifier.setMagnifierActive).toHaveBeenCalledWith(false);
    expect(actions.zoomPan.resetZoom).not.toHaveBeenCalled();

    // ズーム中
    actions.magnifier.isMagnifierActive = false;
    actions.zoomPan.isZoomed = true;
    processViewerKeyDown(createFakeEvent({ key: "Escape" }), {
      readingDirection: "ltr",
      canRename: true,
      canDelete: true,
      actions,
    });
    expect(actions.zoomPan.resetZoom).toHaveBeenCalledTimes(1);
    expect(actions.onClose).not.toHaveBeenCalled();

    // 通常時
    actions.zoomPan.isZoomed = false;
    processViewerKeyDown(createFakeEvent({ key: "Escape" }), {
      readingDirection: "ltr",
      canRename: true,
      canDelete: true,
      actions,
    });
    expect(actions.onClose).toHaveBeenCalledTimes(1);
  });

  it("1キーで実寸大トグル、0キーでズームリセットが呼ばれること", () => {
    processViewerKeyDown(createFakeEvent({ key: "1" }), {
      readingDirection: "ltr",
      canRename: true,
      canDelete: true,
      actions,
    });
    expect(actions.zoomPan.toggleActualSize).toHaveBeenCalledTimes(1);

    processViewerKeyDown(createFakeEvent({ key: "0" }), {
      readingDirection: "ltr",
      canRename: true,
      canDelete: true,
      actions,
    });
    expect(actions.zoomPan.resetZoom).toHaveBeenCalledTimes(1);
  });

  it("useViewerShortcuts フックでウィンドウイベントリスナーが適切に設定・解除されること", () => {
    const { unmount } = renderHook(() =>
      useViewerShortcuts({
        isOpen: true,
        isRenameOpen: false,
        readingDirection: "rtl",
        canRename: true,
        canDelete: true,
        actions,
      })
    );

    // keydownイベント発火
    window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    expect(actions.handleNext).toHaveBeenCalledTimes(1);

    unmount();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    expect(actions.handleNext).toHaveBeenCalledTimes(1); // 解除後は呼ばれない
  });
});
