import { useState, useEffect, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { openPath } from "@tauri-apps/plugin-opener";
import { message } from "@tauri-apps/plugin-dialog";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { useSlideshow } from "./hooks/useSlideshow";
import { useAppEvents } from "./hooks/useAppEvents";
import { useFileOperations } from "./hooks/useFileOperations";
import { MenuBar } from "./components/MenuBar";
import { TopBar } from "./components/TopBar";
import { Gallery } from "./components/Gallery";
import { ImageViewer } from "./components/ImageViewer";
import { ImageInfoModal } from "./components/ImageInfoModal";
import { SettingsModal } from "./components/SettingsModal";
import { FavoritesModal } from "./components/FavoritesModal";
import { SlideIntervalModal } from "./components/SlideIntervalModal";
import { ResizeHandles } from "./components/ResizeHandles";
import { AppBackground } from "./components/AppBackground";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { EntryItem } from "./types";
import { isVirtualPath } from "./utils/pathUtils";
import { useTranslation } from "react-i18next";
import { useSettingsContext } from "./context/SettingsContext";
import { useFileSystemContext } from "./context/FileSystemContext";
import { useUIContext } from "./context/UIContext";
import { useWindow } from "./hooks/useWindow";
import "./App.css";

function App() {
  const { t } = useTranslation();
  const { handleDrag, toggleMaximize } = useWindow();
  
  const {
    currentPath, images, loading, error, loadDirectory, everythingSearch, searchFolders,
    history, recordHistory, isHistoryLoaded, displayEntries, isFavorite, toggleFavorite,
    canGoBack, canGoForward, goBack, goForward, goUp, openFolderDialog
  } = useFileSystemContext();

  const {
    isLoaded: isSettingsLoaded, startupFolderType, everythingEnabled,
    everythingMaxResults, everythingCliPath, background,
    slideInterval, slideLoop, viewMode, readingDirection, firstPageIsCover,
    thumbnailSize, updateThumbnailSize, updateBackground, updateViewMode
  } = useSettingsContext();

  const {
    viewerState, setViewerState, persistentError, setPersistentError,
    selectedInfoPath, setSelectedInfoPath,
    isSettingsOpen, setIsSettingsOpen, isFavoritesOpen, setIsFavoritesOpen,
    isIntervalDialogOpen, setIsIntervalDialogOpen
  } = useUIContext();

  const [isStarted, setIsStarted] = useState(false);
  const { renameEntry } = useFileOperations(loadDirectory);

  // Sync external error to UI context
  useEffect(() => {
    if (error) setPersistentError(error);
  }, [error, setPersistentError]);

  const closeViewer = useCallback(async () => {
    stopTimer();
    try {
      const win = getCurrentWindow();
      if (await win.isFullscreen()) await win.setFullscreen(false);
    } catch (e) {
      console.error("Failed to reset fullscreen on close:", e);
    }
    setViewerState({ isOpen: false, currentIndex: -1 });
  }, [setViewerState]);

  // Explicit navigation handlers that ensure viewer is closed
  const handleGoBack = useCallback(() => {
    if (viewerState.isOpen) closeViewer();
    goBack();
  }, [viewerState.isOpen, closeViewer, goBack]);

  const handleGoForward = useCallback(() => {
    if (viewerState.isOpen) closeViewer();
    goForward();
  }, [viewerState.isOpen, closeViewer, goForward]);

  const handleGoUp = useCallback(() => {
    if (viewerState.isOpen) closeViewer();
    goUp();
  }, [viewerState.isOpen, closeViewer, goUp]);

  const handleLoadDirectory = useCallback((path: string) => {
    if (viewerState.isOpen) closeViewer();
    loadDirectory(path);
  }, [viewerState.isOpen, closeViewer, loadDirectory]);

  const handleOpenFolderDialog = useCallback(async () => {
    if (viewerState.isOpen) closeViewer();
    await openFolderDialog();
  }, [viewerState.isOpen, closeViewer, openFolderDialog]);

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

  // Auto-sync viewer state when images list changes
  useEffect(() => {
    if (viewerState.isOpen) {
      if (!images || images.length === 0) {
        closeViewer();
      } else if (viewerState.currentIndex >= images.length) {
        setViewerState(prev => ({ ...prev, currentIndex: images.length - 1 }));
      }
    }
  }, [images, viewerState.isOpen, viewerState.currentIndex, closeViewer, setViewerState]);

  // Initialize App Events (Shortcut keys, Mouse buttons)
  useAppEvents({
    closeViewer,
    onLoadDirectory: handleLoadDirectory,
    onGoUp: handleGoUp,
    onGoBack: handleGoBack,
    onGoForward: handleGoForward,
    onUpdateViewMode: updateViewMode,
    onSetIsSettingsOpen: setIsSettingsOpen,
    onSetIsFavoritesOpen: setIsFavoritesOpen,
    onSetIsIntervalDialogOpen: setIsIntervalDialogOpen
  }, {
    isViewerOpen: viewerState.isOpen,
    viewMode,
    isSettingsOpen,
    isFavoritesOpen,
    isIntervalDialogOpen
  });

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
    const startIndex = viewerState.currentIndex >= 0 && viewerState.currentIndex < images.length 
      ? viewerState.currentIndex 
      : 0;
    setViewerState({ isOpen: true, currentIndex: startIndex });
    startTimer();
    try {
      await getCurrentWindow().setFullscreen(true);
    } catch (e) {
      console.error("Failed to set fullscreen:", e);
    }
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
    if (viewerState.isOpen) closeViewer();

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
  }, [viewerState.isOpen, closeViewer, everythingEnabled, everythingMaxResults, everythingCliPath, everythingSearch, t, setPersistentError, fallbackSearch]);

  const handleEntryClick = useCallback((entry: EntryItem) => {
    if (!entry) return;
    if (entry.is_dir) {
      handleLoadDirectory(entry.path);
    } else {
      const idx = images.findIndex(img => img.path === entry.path);
      if (idx !== -1) {
        setViewerState({ isOpen: true, currentIndex: idx });
      }
    }
  }, [handleLoadDirectory, images, setViewerState]);

  const onNavigateViewer = useCallback((index: number) => {
    if (images.length === 0) return;
    const safeIndex = Math.max(0, Math.min(index, images.length - 1));
    setViewerState(prev => ({ ...prev, currentIndex: safeIndex }));
  }, [images.length, setViewerState]);

  return (
    <div className={`app-container ${background?.path ? "has-background" : ""}`}>
      <ResizeHandles />
      <ErrorBoundary>
        <AppBackground />
      </ErrorBoundary>

      <MenuBar 
        onStartSlideshow={startSlideshow}
        onRevealCurrentPath={handleRevealCurrentPath}
        onLoadDirectory={handleLoadDirectory}
        onOpenFolderDialog={handleOpenFolderDialog}
      />

      <TopBar 
        currentPath={currentPath}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
        onGoUp={handleGoUp}
        onLoadDirectory={handleLoadDirectory}
        onSearch={handleSearch}
        onDrag={handleDrag}
        onMaximize={toggleMaximize}
      />

      {persistentError && (
        <div className="error-banner">
          <div className="error-message">{persistentError}</div>
          <div className="error-actions">
            <button className="error-copy-btn" onClick={() => writeText(persistentError)}>{t('common.error_copy_info')}</button>
            <button className="error-close-btn" onClick={() => setPersistentError(null)}>×</button>
          </div>
        </div>
      )}

      <ErrorBoundary>
        <Gallery 
          currentPath={currentPath}
          displayEntries={displayEntries}
          loading={loading}
          thumbnailSize={thumbnailSize}
          isFavorite={isFavorite}
          onEntryClick={handleEntryClick}
          onRenameEntry={(oldPath, newName) => renameEntry(oldPath, newName, currentPath)}
          onToggleFavorite={toggleFavorite}
          onUpdateBackground={updateBackground}
          onShowInfo={setSelectedInfoPath}
          onUpdateThumbnailSize={updateThumbnailSize}
        />
      </ErrorBoundary>

      <ErrorBoundary>
        <ImageViewer 
          isOpen={viewerState.isOpen}
          currentIndex={viewerState.currentIndex}
          images={images}
          viewMode={viewMode}
          readingDirection={readingDirection}
          firstPageIsCover={firstPageIsCover}
          onClose={closeViewer}
          onNavigate={onNavigateViewer}
          onShowInfo={setSelectedInfoPath}
          onManualInteraction={stopTimer}
        />
      </ErrorBoundary>

      <ErrorBoundary>
        <SettingsModal />
      </ErrorBoundary>
      <ErrorBoundary>
        <FavoritesModal />
      </ErrorBoundary>
      <ErrorBoundary>
        <SlideIntervalModal />
      </ErrorBoundary>

      {selectedInfoPath && (
        <ErrorBoundary>
          <ImageInfoModal path={selectedInfoPath} onClose={() => setSelectedInfoPath(null)} />
        </ErrorBoundary>
      )}
    </div>
  );
}

export default App;
