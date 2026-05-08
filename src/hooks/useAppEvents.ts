import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useFileSystemContext } from "../context/FileSystemContext";
import { useSettingsContext } from "../context/SettingsContext";
import { useUIContext } from "../context/UIContext";

export function useAppEvents(closeViewer: () => void) {
  const { 
    loadDirectory, goUp, goBack, goForward 
  } = useFileSystemContext();
  
  const { 
    viewMode, updateViewMode
  } = useSettingsContext();
  
  const { 
    viewerState, isFavoritesOpen, setIsFavoritesOpen, 
    isIntervalDialogOpen, setIsIntervalDialogOpen,
    isSettingsOpen, setIsSettingsOpen
  } = useUIContext();

  // Drag and Drop
  useEffect(() => {
    const unlisten = getCurrentWindow().onDragDropEvent((event) => {
      if (event.payload.type === 'drop' && event.payload.paths.length > 0) {
        loadDirectory(event.payload.paths[0]);
      }
    });
    return () => { unlisten.then(fn => fn()); };
  }, [loadDirectory]);

  // Mouse Side Buttons
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 3) {
        if (viewerState.isOpen) {
          e.preventDefault();
          e.stopPropagation();
          closeViewer();
        } else {
          goBack();
        }
      }
      else if (e.button === 4) {
        if (!viewerState.isOpen) {
          goForward();
        }
      }
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [goBack, goForward, viewerState.isOpen, closeViewer]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (viewerState.isOpen) {
        if (e.key.toLowerCase() === "f") {
          const win = getCurrentWindow();
          const isFull = await win.isFullscreen();
          await win.setFullscreen(!isFull);
        } else if (e.key === "Escape" || e.key === "Backspace") {
          closeViewer();
        } else if (e.key.toLowerCase() === "m") {
          updateViewMode(viewMode === "single" ? "spread" : "single");
        }
      } else if (isSettingsOpen || isFavoritesOpen || isIntervalDialogOpen) {
        if (e.key === "Escape") {
          setIsSettingsOpen(false);
          setIsFavoritesOpen(false);
          setIsIntervalDialogOpen(false);
        }
      } else {
        if (e.key === "Escape" || e.key === "Backspace") goUp();
        if (e.altKey && e.key === "ArrowLeft") goBack();
        else if (e.altKey && e.key === "ArrowRight") goForward();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    viewerState.isOpen, isSettingsOpen, isFavoritesOpen, isIntervalDialogOpen, 
    goUp, goBack, goForward, closeViewer, viewMode, updateViewMode, setIsSettingsOpen, 
    setIsFavoritesOpen, setIsIntervalDialogOpen
  ]);
}
