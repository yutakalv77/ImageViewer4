import { EntryItem } from "../types";
import { ContextMenuItem } from "./windowMenuUtils";

export interface CreateViewerContextMenuOptions {
  currentItem: EntryItem | null;
  t: (key: string, options?: any) => string;
  canRename: boolean;
  canDelete: boolean;
  isZoomed: boolean;
  isTransformed: boolean;
  onShowInfo: (path: string) => void;
  onToggleMagnifier: () => void;
  onOpenRename: () => void;
  onDelete: () => void;
  onActualSize: () => void;
  onResetZoom: () => void;
  onRotateCw: () => void;
  onRotateCcw: () => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onResetTransform: () => void;
  onClose: () => void;
}

/**
 * Creates context menu items for the image viewer
 */
export function createViewerContextMenuItems(
  options: CreateViewerContextMenuOptions
): ContextMenuItem[] {
  const {
    currentItem,
    t,
    canRename,
    canDelete,
    isZoomed,
    isTransformed,
    onShowInfo,
    onToggleMagnifier,
    onOpenRename,
    onDelete,
    onActualSize,
    onResetZoom,
    onRotateCw,
    onRotateCcw,
    onFlipH,
    onFlipV,
    onResetTransform,
    onClose,
  } = options;

  return [
    ...(currentItem
      ? [
          {
            label: t("context_menu.show_info"),
            onClick: () => onShowInfo(currentItem.path),
          },
          {
            label: t("context_menu.magnifier", { defaultValue: "拡大鏡" }),
            shortcut: "Z",
            onClick: onToggleMagnifier,
          },
          ...(canRename
            ? [
                {
                  label: t("context_menu.rename", { defaultValue: "名前を変更" }),
                  shortcut: "F2",
                  onClick: onOpenRename,
                },
              ]
            : []),
          ...(canDelete
            ? [
                {
                  label: t("context_menu.trash", { defaultValue: "ごみ箱へ移動" }),
                  shortcut: "Delete",
                  onClick: onDelete,
                },
              ]
            : []),
          { separator: true },
          {
            label: t("context_menu.actual_size", { defaultValue: "実際のサイズ（100%）" }),
            shortcut: "1",
            onClick: onActualSize,
          },
          {
            label: t("context_menu.fit_to_window", { defaultValue: "ウィンドウに合わせる" }),
            shortcut: "0",
            onClick: onResetZoom,
            disabled: !isZoomed,
          },
          { separator: true },
          {
            label: t("view_menu.rotate_cw", { defaultValue: "時計回りに90°回転" }),
            shortcut: "R",
            onClick: onRotateCw,
          },
          {
            label: t("view_menu.rotate_ccw", { defaultValue: "反時計回りに90°回転" }),
            shortcut: "Shift+R",
            onClick: onRotateCcw,
          },
          {
            label: t("view_menu.flip_h", { defaultValue: "左右反転" }),
            shortcut: "H",
            onClick: onFlipH,
          },
          {
            label: t("view_menu.flip_v", { defaultValue: "上下反転" }),
            shortcut: "V",
            onClick: onFlipV,
          },
          ...(isTransformed
            ? [
                {
                  label: t("view_menu.reset_transform", { defaultValue: "回転・反転をリセット" }),
                  shortcut: "Alt+0",
                  onClick: onResetTransform,
                },
              ]
            : []),
          { separator: true },
        ]
      : []),
    { label: t("common.close"), onClick: onClose },
  ];
}
