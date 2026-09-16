import { useState, useEffect, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useOs } from "./useOs";

export function useWindow() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const os = useOs();
  const appWindow = getCurrentWindow();

  useEffect(() => {
    const updateWindowState = async () => {
      try {
        const [maximized, fullscreen] = await Promise.all([
          appWindow.isMaximized ? appWindow.isMaximized() : Promise.resolve(false),
          appWindow.isFullscreen ? appWindow.isFullscreen() : Promise.resolve(false),
        ]);
        setIsMaximized(maximized);
        setIsFullscreen(fullscreen);
      } catch {
        if (typeof document !== "undefined") {
          setIsFullscreen(!!document.fullscreenElement);
        }
      }
    };

    updateWindowState();
    
    let unlistenFn: (() => void) | undefined;
    if (appWindow.onResized) {
      const unlisten = appWindow.onResized(() => {
        updateWindowState();
      });
      unlisten.then(fn => { unlistenFn = fn; }).catch(() => {});
    }

    const handleFullscreenChange = () => {
      if (typeof document !== "undefined") {
        setIsFullscreen(!!document.fullscreenElement);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      if (unlistenFn) unlistenFn();
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [appWindow]);

  const handleDrag = useCallback(async (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    // ダブルクリック（e.detail > 1）時はドラッグ処理を実行せず、onDoubleClick に委譲する
    if (e.detail > 1) return;
    
    try {
      if (typeof appWindow?.startDragging === "function") {
        await appWindow.startDragging();
      }
    } catch (err) {
      console.error("Failed to start dragging:", err);
    }
  }, [appWindow]);

  const toggleMaximize = useCallback(async () => {
    try {
      if (typeof appWindow?.isMaximized === "function") {
        const maximized = await appWindow.isMaximized();
        if (maximized) {
          if (typeof appWindow.unmaximize === "function") {
            await appWindow.unmaximize();
          }
          setIsMaximized(false);
        } else {
          if (typeof appWindow.maximize === "function") {
            await appWindow.maximize();
          }
          setIsMaximized(true);
        }
      } else {
        setIsMaximized((prev) => !prev);
      }
    } catch (err) {
      console.error("Failed to toggle maximize:", err);
    }
  }, [appWindow]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (appWindow.isFullscreen && appWindow.setFullscreen) {
        const isFull = await appWindow.isFullscreen();
        await appWindow.setFullscreen(!isFull);
        setIsFullscreen(!isFull);
      } else if (typeof document !== "undefined") {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        } else {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (e) {
      console.error("Failed to toggle fullscreen:", e);
    }
  }, [appWindow]);

  const setFullscreen = useCallback(async (enable: boolean) => {
    try {
      if (appWindow.setFullscreen) {
        await appWindow.setFullscreen(enable);
        setIsFullscreen(enable);
      } else if (typeof document !== "undefined") {
        if (enable && !document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        } else if (!enable && document.fullscreenElement) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (e) {
      console.error("Failed to set fullscreen:", e);
    }
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
    isFullscreen,
    handleDrag,
    toggleMaximize,
    toggleFullscreen,
    setFullscreen,
    startResizing,
    minimize,
    close,
    appWindow
  };
}
