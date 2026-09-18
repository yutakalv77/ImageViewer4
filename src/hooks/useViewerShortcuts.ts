import { useEffect } from "react";
import { isTargetEditable } from "../utils/domUtils";

export interface ViewerShortcutActions {
  handleNext: () => void;
  handlePrev: () => void;
  onOpenRename: () => void;
  onDelete: () => void;
  onClose: () => void;
  magnifier: {
    isMagnifierActive: boolean;
    toggleMagnifier: () => void;
    setMagnifierActive: (active: boolean) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    increaseLensSize: () => void;
    decreaseLensSize: () => void;
  };
  zoomPan: {
    isZoomed: boolean;
    resetZoom: () => void;
    toggleActualSize: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
  };
  transform: {
    isTransformed: boolean;
    resetTransform: () => void;
    rotateClockwise: () => void;
    rotateCounterClockwise: () => void;
    toggleFlipH: () => void;
    toggleFlipV: () => void;
  };
}

export interface UseViewerShortcutsOptions {
  isOpen: boolean;
  isRenameOpen: boolean;
  readingDirection: "rtl" | "ltr";
  canRename: boolean;
  canDelete: boolean;
  actions: ViewerShortcutActions;
}

/**
 * Pure handler for keyboard shortcut events in ImageViewer
 */
export function processViewerKeyDown(
  e: Pick<KeyboardEvent, "key" | "code" | "altKey" | "ctrlKey" | "shiftKey" | "preventDefault" | "stopPropagation">,
  options: {
    readingDirection: "rtl" | "ltr";
    canRename: boolean;
    canDelete: boolean;
    actions: ViewerShortcutActions;
  }
): boolean {
  const { readingDirection, canRename, canDelete, actions } = options;
  const { magnifier, zoomPan, transform } = actions;

  const isRtl = readingDirection === "rtl";
  const nextKey = isRtl ? "ArrowLeft" : "ArrowRight";
  const prevKey = isRtl ? "ArrowRight" : "ArrowLeft";

  if (e.key === nextKey || e.key === " ") {
    e.preventDefault();
    actions.handleNext();
    return true;
  }
  if (e.key === prevKey) {
    e.preventDefault();
    actions.handlePrev();
    return true;
  }
  if (e.key === "F2" && canRename) {
    e.preventDefault();
    actions.onOpenRename();
    return true;
  }
  if (e.key === "Delete" && canDelete) {
    e.preventDefault();
    actions.onDelete();
    return true;
  }
  if (e.key.toLowerCase() === "z") {
    e.preventDefault();
    magnifier.toggleMagnifier();
    return true;
  }
  if (e.key === "Escape") {
    e.preventDefault();
    e.stopPropagation();
    if (magnifier.isMagnifierActive) {
      magnifier.setMagnifierActive(false);
    } else if (zoomPan.isZoomed) {
      zoomPan.resetZoom();
    } else if (transform.isTransformed) {
      transform.resetTransform();
    } else {
      actions.onClose();
    }
    return true;
  }

  if (magnifier.isMagnifierActive) {
    const isNumpadAdd = e.code === "NumpadAdd";
    const isNumpadSubtract = e.code === "NumpadSubtract";
    const isMinusKey = e.code === "Minus" || e.key === "-";
    const isPlusKey = e.key === "+" || (!e.shiftKey && e.key === "=");

    if (e.ctrlKey) {
      if (isPlusKey || isNumpadAdd) {
        e.preventDefault();
        magnifier.zoomIn();
        return true;
      }
      if (isMinusKey || isNumpadSubtract) {
        e.preventDefault();
        magnifier.zoomOut();
        return true;
      }
    } else if (e.shiftKey) {
      if (isNumpadAdd || e.code === "Equal" || e.key === "*" || e.code === "BracketRight") {
        e.preventDefault();
        magnifier.increaseLensSize();
        return true;
      }
      if (isMinusKey || isNumpadSubtract || e.key === "_" || (e.code === "Minus" && e.key === "=")) {
        e.preventDefault();
        magnifier.decreaseLensSize();
        return true;
      }
      if (isPlusKey) {
        e.preventDefault();
        magnifier.zoomIn();
        return true;
      }
    } else {
      if (isPlusKey || isNumpadAdd) {
        e.preventDefault();
        magnifier.zoomIn();
        return true;
      }
      if (isMinusKey || isNumpadSubtract) {
        e.preventDefault();
        magnifier.zoomOut();
        return true;
      }
    }
    return false;
  }

  // Rotate & Flip & Zoom shortcuts (check Alt+0 before zoom 0)
  if (e.altKey && e.key === "0") {
    e.preventDefault();
    transform.resetTransform();
    return true;
  }
  if (e.key === "0" || (e.ctrlKey && e.key === "0")) {
    e.preventDefault();
    zoomPan.resetZoom();
    return true;
  }
  if (e.key === "1" || (e.ctrlKey && e.key === "1")) {
    e.preventDefault();
    zoomPan.toggleActualSize();
    return true;
  }
  if (e.key === "+" || (!e.shiftKey && e.key === "=") || e.code === "NumpadAdd") {
    e.preventDefault();
    zoomPan.zoomIn();
    return true;
  }
  if (e.key === "-" || e.code === "NumpadSubtract") {
    e.preventDefault();
    zoomPan.zoomOut();
    return true;
  }
  if (e.key === "r" || e.key === "R") {
    e.preventDefault();
    if (e.shiftKey) {
      transform.rotateCounterClockwise();
    } else {
      transform.rotateClockwise();
    }
    return true;
  }
  if (e.key === "l" || e.key === "L") {
    e.preventDefault();
    transform.rotateCounterClockwise();
    return true;
  }
  if (e.key === "h" || e.key === "H") {
    e.preventDefault();
    transform.toggleFlipH();
    return true;
  }
  if (e.key === "v" || e.key === "V") {
    e.preventDefault();
    transform.toggleFlipV();
    return true;
  }

  return false;
}

/**
 * Custom hook to register and manage ImageViewer keyboard shortcuts
 */
export function useViewerShortcuts({
  isOpen,
  isRenameOpen,
  readingDirection,
  canRename,
  canDelete,
  actions,
}: UseViewerShortcutsOptions): void {
  useEffect(() => {
    if (!isOpen || isRenameOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTargetEditable(e.target)) return;

      processViewerKeyDown(e, {
        readingDirection,
        canRename,
        canDelete,
        actions,
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isRenameOpen, readingDirection, canRename, canDelete, actions]);
}
