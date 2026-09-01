import { useState, useEffect, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useOs } from "./useOs";

export function useWindow() {
  const [isMaximized, setIsMaximized] = useState(false);
  const os = useOs();
  const appWindow = getCurrentWindow();

  useEffect(() => {
    // Initial state
    appWindow.isMaximized().then(setIsMaximized);
    
    const unlisten = appWindow.onResized(() => {
      appWindow.isMaximized().then(setIsMaximized);
    });

    return () => {
      unlisten.then(fn => fn()).catch(() => {});
    };
  }, [appWindow]);

  const handleDrag = useCallback(async (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    if (await appWindow.isMaximized()) {
      await appWindow.unmaximize();
    }
    await appWindow.startDragging();
  }, [appWindow]);

  const toggleMaximize = useCallback(() => {
    appWindow.toggleMaximize();
  }, [appWindow]);

  const startResizing = useCallback((direction: string) => {
    // @ts-ignore
    appWindow.startResizeDragging(direction);
  }, [appWindow]);

  const minimize = useCallback(() => appWindow.minimize(), [appWindow]);
  const close = useCallback(() => appWindow.close(), [appWindow]);

  return {
    os,
    isMaximized,
    handleDrag,
    toggleMaximize,
    startResizing,
    minimize,
    close,
    appWindow
  };
}
