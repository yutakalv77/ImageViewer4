import { useState, useEffect, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { openPath } from "@tauri-apps/plugin-opener";
import { message } from "@tauri-apps/plugin-dialog";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { useSlideshow } from "./hooks/useSlideshow";
import { useAppEvents } from "./hooks/useAppEvents";
import { MenuBar } from "./components/MenuBar";
import { TopBar } from "./components/TopBar";
import { Gallery } from "./components/Gallery";
import { ImageViewer } from "./components/ImageViewer";
import { SettingsModal } from "./components/SettingsModal";
import { FavoritesModal } from "./components/FavoritesModal";
import { SlideIntervalModal } from "./components/SlideIntervalModal";
import { ResizeHandles } from "./components/ResizeHandles";
import { AppBackground } from "./components/AppBackground";
import { EntryItem } from "./types";
import { isVirtualPath } from "./utils/virtualPathUtils";
import { useTranslation } from "react-i18next";
import { useSettingsContext } from "./context/SettingsContext";
import { useFileSystemContext } from "./context/FileSystemContext";
import { useUIContext } from "./context/UIContext";
import "./App.css";

function App() {
  const { t } = useTranslation();
  
  const {
    currentPath, images, error, loadDirectory, everythingSearch, searchFolders,
    history, recordHistory, isHistoryLoaded
  } = useFileSystemContext();

  const {
    isLoaded: isSettingsLoaded, startupFolderType, everythingEnabled,
    everythingMaxResults, everythingCliPath, background,
    slideInterval, slideLoop, viewMode, readingDirection, firstPageIsCover
  } = useSettingsContext();

  const {
    viewerState, setViewerState, persistentError, setPersistentError
  } = useUIContext();

  const [isStarted, setIsStarted] = useState(false);

  // Sync external error to UI context
  useEffect(() => {
    if (error) setPersistentError(error);
  }, [error, setPersistentError]);

  const closeViewer = useCallback(async () => {
    stopTimer();
    const win = getCurrentWindow();
    if (await win.isFullscreen()) await win.setFullscreen(false);
    setViewerState({ isOpen: false, currentIndex: -1 });
  }, [setViewerState]);

  // Slideshow Logic
  const { start: startTimer, stop: stopTimer } = useSlideshow(
    { viewMode, firstPageIsCover, totalImages: images.length, readingDirection },
    slideInterval,
    slideLoop,
    (next) => {
      setViewerState(prev => ({
        ...prev,
        currentIndex: typeof next === 'function' ? next(prev.currentIndex) : next
      }));
    }
  );

  // Initialize App Events
  useAppEvents(closeViewer);

  // Handle Startup Path
  useEffect(() => {
    if (isHistoryLoaded && isSettingsLoaded && !isStarted) {
      if (startupFolderType === "last" && history.length > 0) {
        loadDirectory(history[0].path);
      }
      setIsStarted(true);
    }
  }, [isHistoryLoaded, isSettingsLoaded, isStarted, startupFolderType, history, loadDirectory]);

  // Record history
  useEffect(() => {
    if (currentPath && isStarted && !isVirtualPath(currentPath)) {
      recordHistory(currentPath);
    }
  }, [currentPath, recordHistory, isStarted]);

  const startSlideshow = useCallback(async () => {
    if (images.length === 0) return;
    const startIndex = viewerState.currentIndex >= 0 ? viewerState.currentIndex : 0;
    setViewerState({ isOpen: true, currentIndex: startIndex });
    startTimer();
    await getCurrentWindow().setFullscreen(true);
  }, [images.length, viewerState.currentIndex, startTimer, setViewerState]);

  const handleRevealCurrentPath = useCallback(async () => {
    if (currentPath && !isVirtualPath(currentPath)) {
      try {
        await openPath(currentPath);
      } catch (err) {
        console.error("Failed to open current path:", err);
      }
    }
  }, [currentPath]);

  const fallbackSearch = useCallback((query: string) => {
    if (currentPath && !isVirtualPath(currentPath)) {
      searchFolders(currentPath, query);
    } else if (history.length > 0) {
      searchFolders(history[0].path, query);
    }
  }, [currentPath, history, searchFolders]);

  const handleSearch = useCallback(async (query: string) => {
    if (everythingEnabled) {
      try {
        const isRunning: boolean = await invoke("check_everything_running");
        if (!isRunning) throw new Error(t('settings.everything_status_stopped'));
        
        await everythingSearch(query, everythingMaxResults, everythingCliPath);
        setPersistentError(null);
      } catch (err: any) {
        console.error("Everything search failed:", err);
        const errMsg = err.message || err.toString();
        setPersistentError(errMsg);
        await message(errMsg, { 
          title: t('settings.everything_error_title'),
          kind: 'error' 
        });
        fallbackSearch(query);
      }
    } else {
      fallbackSearch(query);
    }
  }, [everythingEnabled, everythingMaxResults, everythingCliPath, everythingSearch, t, setPersistentError, fallbackSearch]);

  const handleEntryClick = (entry: EntryItem) => {
    if (entry.is_dir) {
      loadDirectory(entry.path);
    } else {
      const idx = images.findIndex(img => img.path === entry.path);
      setViewerState({ isOpen: true, currentIndex: idx });
    }
  };

  return (
    <div className={`app-container ${background.path ? "has-background" : ""}`}>
      <ResizeHandles />
      <AppBackground />

      <MenuBar 
        onStartSlideshow={startSlideshow}
        onRevealCurrentPath={handleRevealCurrentPath}
      />

      <TopBar onSearch={handleSearch} />

      {persistentError && (
        <div className="error-banner">
          <div className="error-message">{persistentError}</div>
          <div className="error-actions">
            <button className="error-copy-btn" onClick={() => writeText(persistentError)}>{t('common.error_copy_info')}</button>
            <button className="error-close-btn" onClick={() => setPersistentError(null)}>×</button>
          </div>
        </div>
      )}

      <Gallery onEntryClick={handleEntryClick} />

      <ImageViewer 
        onClose={closeViewer} 
        onManualInteraction={stopTimer}
      />

      <SettingsModal />
      <FavoritesModal />
      <SlideIntervalModal />
    </div>
  );
}

export default App;
