import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useWindow } from "./useWindow";
import {
  buildWindowMenuItems,
  isTargetInputOrTextarea,
  ContextMenuItem
} from "../utils/windowMenuUtils";

export interface UseWindowSystemMenuResult {
  menuPosition: { x: number; y: number } | null;
  menuItems: ContextMenuItem[];
  handleHeaderContextMenu: (e: React.MouseEvent) => void;
  closeMenu: () => void;
}

/**
 * ウィンドウのヘッダー部における右クリック（システムメニュー表示）や Alt+Space ショートカットを管理するカスタムフック
 */
export function useWindowSystemMenu(): UseWindowSystemMenuResult {
  const { t } = useTranslation();
  const { isMaximized, appWindow } = useWindow();
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);

  const closeMenu = useCallback(() => {
    setMenuPosition(null);
  }, []);

  const handleRestore = useCallback(async () => {
    try {
      if (appWindow.unmaximize) {
        await appWindow.unmaximize();
      }
    } catch (err) {
      console.error("Failed to unmaximize window:", err);
    }
    closeMenu();
  }, [appWindow, closeMenu]);

  const handleMove = useCallback(async () => {
    closeMenu();
    try {
      if (appWindow.startDragging) {
        await appWindow.startDragging();
      }
    } catch (err) {
      console.error("Failed to start dragging window:", err);
    }
  }, [appWindow, closeMenu]);

  const handleSize = useCallback(async () => {
    closeMenu();
    try {
      if ((appWindow as any).startResizeDragging) {
        await (appWindow as any).startResizeDragging("SouthEast");
      }
    } catch (err) {
      console.error("Failed to start resize dragging window:", err);
    }
  }, [appWindow, closeMenu]);

  const handleMinimize = useCallback(async () => {
    closeMenu();
    try {
      if (appWindow.minimize) {
        await appWindow.minimize();
      }
    } catch (err) {
      console.error("Failed to minimize window:", err);
    }
  }, [appWindow, closeMenu]);

  const handleMaximize = useCallback(async () => {
    try {
      if (appWindow.maximize) {
        await appWindow.maximize();
      }
    } catch (err) {
      console.error("Failed to maximize window:", err);
    }
    closeMenu();
  }, [appWindow, closeMenu]);

  const handleClose = useCallback(async () => {
    closeMenu();
    try {
      if (appWindow.close) {
        await appWindow.close();
      }
    } catch (err) {
      console.error("Failed to close window:", err);
    }
  }, [appWindow, closeMenu]);

  const menuItems = useMemo(() => {
    return buildWindowMenuItems({
      isMaximized,
      t,
      onRestore: handleRestore,
      onMove: handleMove,
      onSize: handleSize,
      onMinimize: handleMinimize,
      onMaximize: handleMaximize,
      onClose: handleClose,
    });
  }, [
    isMaximized,
    t,
    handleRestore,
    handleMove,
    handleSize,
    handleMinimize,
    handleMaximize,
    handleClose,
  ]);

  const handleHeaderContextMenu = useCallback((e: React.MouseEvent) => {
    if (isTargetInputOrTextarea(e.target)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setMenuPosition({ x: e.clientX, y: e.clientY });
  }, []);

  // Windows標準の Alt + Space キーによるシステムメニュー表示をサポート
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.code === "Space") {
        e.preventDefault();
        setMenuPosition({ x: 8, y: 32 });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return {
    menuPosition,
    menuItems,
    handleHeaderContextMenu,
    closeMenu,
  };
}
