import { describe, it, expect, vi } from "vitest";
import { createViewerContextMenuItems } from "../utils/viewerContextMenu";
import { EntryItem } from "../types";

describe("viewerContextMenu", () => {
  const dummyItem: EntryItem = {
    name: "test.jpg",
    path: "C:/images/test.jpg",
    is_dir: false,
    thumbnail_path: null,
  };

  const defaultOptions = {
    currentItem: dummyItem,
    t: (key: string, opts?: any) => opts?.defaultValue || key,
    canRename: true,
    canDelete: true,
    isZoomed: false,
    isTransformed: false,
    onShowInfo: vi.fn(),
    onToggleMagnifier: vi.fn(),
    onOpenRename: vi.fn(),
    onDelete: vi.fn(),
    onActualSize: vi.fn(),
    onResetZoom: vi.fn(),
    onRotateCw: vi.fn(),
    onRotateCcw: vi.fn(),
    onFlipH: vi.fn(),
    onFlipV: vi.fn(),
    onResetTransform: vi.fn(),
    onClose: vi.fn(),
  };

  it("currentItem が存在する場合、各種メニュー項目が構築されること", () => {
    const items = createViewerContextMenuItems(defaultOptions);

    expect(items.some((item) => item.label === "context_menu.show_info")).toBe(true);
    expect(items.some((item) => item.label === "拡大鏡")).toBe(true);
    expect(items.some((item) => item.label === "名前を変更")).toBe(true);
    expect(items.some((item) => item.label === "ごみ箱へ移動")).toBe(true);
    expect(items.some((item) => item.label === "実際のサイズ（100%）")).toBe(true);
    expect(items.some((item) => item.label === "ウィンドウに合わせる")).toBe(true);
    expect(items.some((item) => item.label === "common.close")).toBe(true);
  });

  it("isZoomed が false の場合、ウィンドウに合わせるが無効化されていること", () => {
    const items = createViewerContextMenuItems({ ...defaultOptions, isZoomed: false });
    const fitItem = items.find((item) => item.label === "ウィンドウに合わせる");
    expect(fitItem?.disabled).toBe(true);
  });

  it("isZoomed が true の場合、ウィンドウに合わせるが有効化されていること", () => {
    const items = createViewerContextMenuItems({ ...defaultOptions, isZoomed: true });
    const fitItem = items.find((item) => item.label === "ウィンドウに合わせる");
    expect(fitItem?.disabled).toBe(false);
  });

  it("isTransformed が true の場合、回転・反転リセット項目が含まれること", () => {
    const items = createViewerContextMenuItems({ ...defaultOptions, isTransformed: true });
    expect(items.some((item) => item.label === "回転・反転をリセット")).toBe(true);
  });

  it("isTransformed が false の場合、回転・反転リセット項目が含まれないこと", () => {
    const items = createViewerContextMenuItems({ ...defaultOptions, isTransformed: false });
    expect(items.some((item) => item.label === "回転・反転をリセット")).toBe(false);
  });

  it("canRename が false の場合、名前を変更項目が含まれないこと", () => {
    const items = createViewerContextMenuItems({ ...defaultOptions, canRename: false });
    expect(items.some((item) => item.label === "名前を変更")).toBe(false);
  });

  it("canDelete が false の場合、ごみ箱へ移動項目が含まれないこと", () => {
    const items = createViewerContextMenuItems({ ...defaultOptions, canDelete: false });
    expect(items.some((item) => item.label === "ごみ箱へ移動")).toBe(false);
  });

  it("currentItem が null の場合、閉じる項目のみが含まれること", () => {
    const items = createViewerContextMenuItems({ ...defaultOptions, currentItem: null });
    expect(items).toHaveLength(1);
    expect(items[0].label).toBe("common.close");
  });

  it("各コールバックが正常に呼び出されること", () => {
    const onShowInfo = vi.fn();
    const onActualSize = vi.fn();
    const items = createViewerContextMenuItems({ ...defaultOptions, onShowInfo, onActualSize });

    const showInfoItem = items.find((item) => item.label === "context_menu.show_info");
    showInfoItem?.onClick?.();
    expect(onShowInfo).toHaveBeenCalledWith(dummyItem.path);

    const actualSizeItem = items.find((item) => item.label === "実際のサイズ（100%）");
    actualSizeItem?.onClick?.();
    expect(onActualSize).toHaveBeenCalled();
  });
});
