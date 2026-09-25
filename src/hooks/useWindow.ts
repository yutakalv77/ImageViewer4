import { useState, useEffect, useCallback, useRef } from "react";
import { getCurrentWindow, currentMonitor, primaryMonitor } from "@tauri-apps/api/window";
import { PhysicalPosition, PhysicalSize } from "@tauri-apps/api/dpi";
import { useOs } from "./useOs";
import {
  calculateVerticalFitBounds,
  PrevVerticalBounds,
  WindowBounds,
  WorkArea,
} from "../utils/windowBoundsUtils";

export function useWindow() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const prevVerticalBoundsRef = useRef<PrevVerticalBounds | null>(null);
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

  const toggleVerticalMaximize = useCallback(async () => {
    try {
      if (isMaximized || isFullscreen) return;

      let workArea: WorkArea | null = null;
      let monitor = typeof currentMonitor === "function" ? await currentMonitor() : null;
      if (!monitor && typeof primaryMonitor === "function") {
        monitor = await primaryMonitor();
      }

      if (monitor?.workArea) {
        workArea = {
          x: monitor.workArea.position.x,
          y: monitor.workArea.position.y,
          width: monitor.workArea.size.width,
          height: monitor.workArea.size.height,
        };
      }

      if (!workArea) {
        return;
      }

      const [pos, size] = await Promise.all([
        typeof appWindow?.outerPosition === "function" ? appWindow.outerPosition() : Promise.resolve(null),
        typeof appWindow?.outerSize === "function" ? appWindow.outerSize() : Promise.resolve(null),
      ]);

      if (!pos || !size) return;

      const currentBounds: WindowBounds = {
        x: pos.x,
        y: pos.y,
        width: size.width,
        height: size.height,
      };

      const result = calculateVerticalFitBounds(
        currentBounds,
        workArea,
        prevVerticalBoundsRef.current
      );

      prevVerticalBoundsRef.current = result.nextPrevBounds;

      if (result.action === "restore") {
        // 復元（縮小）時は先にサイズを小さくしてから位置を移動し、画面下端へのはみ出しを防止
        if (typeof appWindow?.setSize === "function") {
          await appWindow.setSize(new PhysicalSize(result.nextBounds.width, result.nextBounds.height));
        }
        if (typeof appWindow?.setPosition === "function") {
          await appWindow.setPosition(new PhysicalPosition(result.nextBounds.x, result.nextBounds.y));
        }
      } else {
        // 垂直フィット（拡大）時は先に上端へ移動してから高さを広げ、画面下端へのはみ出しを防止
        if (typeof appWindow?.setPosition === "function") {
          await appWindow.setPosition(new PhysicalPosition(result.nextBounds.x, result.nextBounds.y));
        }
        if (typeof appWindow?.setSize === "function") {
          await appWindow.setSize(new PhysicalSize(result.nextBounds.width, result.nextBounds.height));
        }
      }
    } catch (err) {
      console.error("Failed to toggle vertical maximize:", err);
    }
  }, [appWindow, isMaximized, isFullscreen]);

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
    toggleVerticalMaximize,
    toggleFullscreen,
    setFullscreen,
    startResizing,
    minimize,
    close,
    appWindow
  };
}
