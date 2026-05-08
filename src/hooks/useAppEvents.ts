import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

interface AppEventHandlers {
  closeViewer: () => void;
  onLoadDirectory: (path: string) => void;
  onGoUp: () => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onUpdateViewMode: (mode: "single" | "spread") => void;
  onSetIsSettingsOpen: (open: boolean) => void;
  onSetIsFavoritesOpen: (open: boolean) => void;
  onSetIsIntervalDialogOpen: (open: boolean) => void;
}

interface AppState {
  isViewerOpen: boolean;
  viewMode: "single" | "spread";
  isSettingsOpen: boolean;
  isFavoritesOpen: boolean;
  isIntervalDialogOpen: boolean;
}

export function useAppEvents(handlers: AppEventHandlers, state: AppState) {
  // Drag and Drop
  useEffect(() => {
    const unlisten = getCurrentWindow().onDragDropEvent((event) => {
      if (event.payload.type === 'drop' && event.payload.paths.length > 0) {
        handlers.onLoadDirectory(event.payload.paths[0]);
      }
    });
    return () => { unlisten.then(fn => fn()); };
  }, [handlers]);

  // Mouse Side Buttons
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 3) {
        if (state.isViewerOpen) {
          e.preventDefault();
          e.stopPropagation();
          handlers.closeViewer();
        } else {
          handlers.onGoBack();
        }
      }
      else if (e.button === 4) {
        if (!state.isViewerOpen) {
          handlers.onGoForward();
        }
      }
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [handlers, state.isViewerOpen]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (state.isViewerOpen) {
        if (e.key.toLowerCase() === "f") {
          const win = getCurrentWindow();
          const isFull = await win.isFullscreen();
          await win.setFullscreen(!isFull);
        } else if (e.key === "Escape" || e.key === "Backspace") {
          handlers.closeViewer();
        } else if (e.key.toLowerCase() === "m") {
          handlers.onUpdateViewMode(state.viewMode === "single" ? "spread" : "single");
        }
      } else if (state.isSettingsOpen || state.isFavoritesOpen || state.isIntervalDialogOpen) {
        if (e.key === "Escape") {
          handlers.onSetIsSettingsOpen(false);
          handlers.onSetIsFavoritesOpen(false);
          handlers.onSetIsIntervalDialogOpen(false);
        }
      } else {
        if (e.key === "Escape" || e.key === "Backspace") handlers.onGoUp();
        if (e.altKey && e.key === "ArrowLeft") handlers.onGoBack();
        else if (e.altKey && e.key === "ArrowRight") handlers.onGoForward();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state, handlers]);
}
