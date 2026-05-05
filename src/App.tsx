import { useState, useEffect, useMemo, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useFileSystem } from "./hooks/useFileSystem";
import { useSettings } from "./hooks/useSettings";
import { useHistory } from "./hooks/useHistory";
import { useFavorites } from "./hooks/useFavorites";
import { MenuBar } from "./components/MenuBar";
import { TopBar } from "./components/TopBar";
import { Gallery } from "./components/Gallery";
import { ImageViewer } from "./components/ImageViewer";
import { SettingsModal } from "./components/SettingsModal";
import { FavoritesModal } from "./components/FavoritesModal";
import { SlideIntervalModal } from "./components/SlideIntervalModal";
import { ResizeHandles } from "./components/ResizeHandles";
import { EntryItem, ViewerState } from "./types";
import "./App.css";

function App() {
  const { 
    currentPath, 
    entries, 
    loading, 
    error, 
    canGoBack,
    canGoForward,
    loadDirectory, 
    openFolderDialog, 
    goUp,
    goBack,
    goForward
  } = useFileSystem();

  const {
    isSettingsOpen,
    setIsSettingsOpen,
    activeSettingsTab,
    setActiveSettingsTab,
    dataStoragePath,
    changeStoragePath,
    historyRetentionDays,
    updateHistoryRetention,
    startupFolderType,
    updateStartupFolderType,
    slideInterval,
    updateSlideInterval,
    slideLoop,
    toggleSlideLoop,
    viewMode,
    updateViewMode,
    readingDirection,
    updateReadingDirection,
    firstPageIsCover,
    toggleFirstPageIsCover
  } = useSettings();

  const {
    history,
    recordHistory,
    isLoaded: isHistoryLoaded,
  } = useHistory(dataStoragePath, historyRetentionDays);

  const {
    favorites,
    isFavorite,
    toggleFavorite,
    updateAllFavorites,
  } = useFavorites(dataStoragePath);

  const [viewerState, setViewerState] = useState<ViewerState>({ 
    isOpen: false, 
    currentIndex: -1 
  });

  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isIntervalDialogOpen, setIsIntervalDialogOpen] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isSlideshowActive, setIsSlideshowActive] = useState(false);

  // Handle Startup Path
  useEffect(() => {
    if (isHistoryLoaded && !isStarted) {
      if (startupFolderType === "last" && history.length > 0) {
        loadDirectory(history[0].path);
      }
      setIsStarted(true);
    }
  }, [isHistoryLoaded, isStarted, startupFolderType, history, loadDirectory]);

  const images = useMemo(() => entries.filter(e => !e.is_dir), [entries]);

  // Record history when currentPath changes
  useEffect(() => {
    if (currentPath && isStarted) {
      recordHistory(currentPath);
    }
  }, [currentPath, recordHistory, isStarted]);

  // Drag and Drop
  useEffect(() => {
    const unlisten = getCurrentWindow().onDragDropEvent((event) => {
      if (event.payload.type === 'drop') {
        const droppedPaths = event.payload.paths;
        if (droppedPaths.length > 0) {
          loadDirectory(droppedPaths[0]);
        }
      }
    });
    return () => { unlisten.then(fn => fn()); };
  }, [loadDirectory]);

  // Mouse Side Buttons
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 3) {
        goBack(); // Side button 3 is "Back"
      } else if (e.button === 4) {
        goForward(); // Side button 4 is "Forward"
      }
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [goBack, goForward]);

  // Slideshow logic
  useEffect(() => {
    let timer: number | undefined;
    if (isSlideshowActive && viewerState.isOpen && images.length > 0) {
      timer = window.setInterval(() => {
        setViewerState(prev => {
          let nextIndex = prev.currentIndex;
          if (viewMode === "single") {
            nextIndex += 1;
          } else {
            // Spread mode step
            const step = (prev.currentIndex === 0 && firstPageIsCover) ? 1 : 2;
            nextIndex += step;
          }

          if (nextIndex >= images.length) {
            if (slideLoop) {
              return { ...prev, currentIndex: 0 };
            } else {
              setIsSlideshowActive(false);
              return prev;
            }
          }
          return { ...prev, currentIndex: nextIndex };
        });
      }, slideInterval * 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSlideshowActive, viewerState.isOpen, images.length, slideInterval, slideLoop, viewMode, firstPageIsCover]);

  const startSlideshow = useCallback(async () => {
    if (images.length === 0) return;
    
    const startIndex = viewerState.currentIndex >= 0 ? viewerState.currentIndex : 0;
    setViewerState({ isOpen: true, currentIndex: startIndex });
    setIsSlideshowActive(true);
    
    const win = getCurrentWindow();
    await win.setFullscreen(true);
  }, [images.length, viewerState.currentIndex]);

  const stopSlideshow = useCallback(async () => {
    setIsSlideshowActive(false);
    const win = getCurrentWindow();
    if (await win.isFullscreen()) {
      await win.setFullscreen(false);
    }
  }, []);

  const handleNavigate = useCallback((index: number) => {
    setViewerState(prev => ({ ...prev, currentIndex: index }));
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const win = getCurrentWindow();

      if (viewerState.isOpen) {
        if (e.key.toLowerCase() === "f" || e.code === "KeyF") {
          const isFull = await win.isFullscreen();
          await win.setFullscreen(!isFull);
        } else if (e.key === "Escape" || e.key === "Backspace") {
          await stopSlideshow();
          setViewerState({ isOpen: false, currentIndex: -1 });
        } else if (e.key === "ArrowDown" || e.key === " ") {
          e.preventDefault();
          setIsSlideshowActive(false);
          const step = (viewMode === "spread" && !(viewerState.currentIndex === 0 && firstPageIsCover)) ? 2 : 1;
          setViewerState(prev => ({
            ...prev,
            currentIndex: Math.min(prev.currentIndex + step, images.length - 1)
          }));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setIsSlideshowActive(false);
          const step = (viewMode === "spread" && !(viewerState.currentIndex <= 2 && firstPageIsCover)) ? 2 : 1;
          // Simple logic for back is handled in ImageViewer as well, 
          // but App.tsx handles the global state. 
          // Actually ImageViewer should probably just use onNavigate and App.tsx handles keys?
          // For now, I'll keep it consistent.
          setViewerState(prev => ({
            ...prev,
            currentIndex: Math.max(prev.currentIndex - step, 0)
          }));
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
        if (e.key === "Escape" || e.key === "Backspace") {
          goUp();
        }
        if (e.altKey && e.key === "ArrowLeft") {
          goBack();
        } else if (e.altKey && e.key === "ArrowRight") {
          goForward();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewerState.isOpen, viewerState.currentIndex, isSettingsOpen, isFavoritesOpen, isIntervalDialogOpen, images.length, goUp, goBack, goForward, stopSlideshow, viewMode, firstPageIsCover, updateViewMode]);

  const handleEntryClick = (entry: EntryItem) => {
    if (entry.is_dir) {
      loadDirectory(entry.path);
    } else {
      const idx = images.findIndex(img => img.path === entry.path);
      setViewerState({ isOpen: true, currentIndex: idx });
    }
  };

  return (
    <div className="app-container">
      <ResizeHandles />

      <MenuBar 
        history={history}
        slideInterval={slideInterval}
        slideLoop={slideLoop}
        viewMode={viewMode}
        readingDirection={readingDirection}
        firstPageIsCover={firstPageIsCover}
        onOpenFolder={openFolderDialog} 
        onOpenSettings={() => setIsSettingsOpen(true)} 
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onSelectHistory={loadDirectory}
        onStartSlideshow={startSlideshow}
        onToggleLoop={toggleSlideLoop}
        onUpdateInterval={updateSlideInterval}
        onOpenIntervalDialog={() => setIsIntervalDialogOpen(true)}
        onUpdateViewMode={updateViewMode}
        onUpdateReadingDirection={updateReadingDirection}
        onToggleFirstPageIsCover={toggleFirstPageIsCover}
      />

      <TopBar 
        currentPath={currentPath} 
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onNavigate={loadDirectory}
        onGoUp={goUp}
        onGoBack={goBack}
        onGoForward={goForward}
      />

      {error && <div className="error">{error}</div>}

      <Gallery 
        entries={entries} 
        loading={loading} 
        currentPath={currentPath} 
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        onEntryClick={handleEntryClick} 
        onRefresh={() => loadDirectory(currentPath)}
      />

      <ImageViewer 
        images={images} 
        currentIndex={viewerState.currentIndex} 
        viewMode={viewMode}
        readingDirection={readingDirection}
        firstPageIsCover={firstPageIsCover}
        onClose={() => {
          stopSlideshow();
          setViewerState({ isOpen: false, currentIndex: -1 });
        }} 
        onNavigate={handleNavigate}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        activeTab={activeSettingsTab}
        dataStoragePath={dataStoragePath}
        historyRetentionDays={historyRetentionDays}
        startupFolderType={startupFolderType}
        onClose={() => setIsSettingsOpen(false)}
        onTabChange={setActiveSettingsTab}
        onChangeStoragePath={changeStoragePath}
        onUpdateHistoryRetention={updateHistoryRetention}
        onUpdateStartupFolderType={updateStartupFolderType}
      />

      <FavoritesModal
        isOpen={isFavoritesOpen}
        favorites={favorites}
        onClose={() => setIsFavoritesOpen(false)}
        onSave={updateAllFavorites}
        onNavigate={loadDirectory}
      />

      <SlideIntervalModal
        isOpen={isIntervalDialogOpen}
        currentInterval={slideInterval}
        onClose={() => setIsIntervalDialogOpen(false)}
        onSave={updateSlideInterval}
      />
    </div>
  );
}

export default App;
