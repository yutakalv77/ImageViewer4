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
          const nextIndex = prev.currentIndex + 1;
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
  }, [isSlideshowActive, viewerState.isOpen, images.length, slideInterval, slideLoop]);

  const startSlideshow = useCallback(async () => {
    if (images.length === 0) return;
    
    // Start from current selection or index 0
    const startIndex = viewerState.currentIndex >= 0 ? viewerState.currentIndex : 0;
    setViewerState({ isOpen: true, currentIndex: startIndex });
    setIsSlideshowActive(true);
    
    // Enter fullscreen
    const win = getCurrentWindow();
    await win.setFullscreen(true);
  }, [images.length, viewerState.currentIndex]);

  const stopSlideshow = useCallback(async () => {
    setIsSlideshowActive(false);
    // Exit fullscreen if closing viewer
    const win = getCurrentWindow();
    if (await win.isFullscreen()) {
      await win.setFullscreen(false);
    }
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
          setIsSlideshowActive(false); // Manual navigation stops slideshow
          setViewerState(prev => ({
            ...prev,
            currentIndex: Math.min(prev.currentIndex + 1, images.length - 1)
          }));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setIsSlideshowActive(false); // Manual navigation stops slideshow
          setViewerState(prev => ({
            ...prev,
            currentIndex: Math.max(prev.currentIndex - 1, 0)
          }));
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
        // Alt + Arrow keys for navigation
        if (e.altKey && e.key === "ArrowLeft") {
          goBack();
        } else if (e.altKey && e.key === "ArrowRight") {
          goForward();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewerState.isOpen, isSettingsOpen, isFavoritesOpen, isIntervalDialogOpen, images.length, goUp, goBack, goForward, stopSlideshow]);

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
        onOpenFolder={openFolderDialog} 
        onOpenSettings={() => setIsSettingsOpen(true)} 
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onSelectHistory={loadDirectory}
        onStartSlideshow={startSlideshow}
        onToggleLoop={toggleSlideLoop}
        onUpdateInterval={updateSlideInterval}
        onOpenIntervalDialog={() => setIsIntervalDialogOpen(true)}
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
        onClose={() => {
          stopSlideshow();
          setViewerState({ isOpen: false, currentIndex: -1 });
        }} 
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
