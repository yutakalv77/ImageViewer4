import { useState, useEffect, useMemo } from "react";
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
  const [isStarted, setIsStarted] = useState(false);

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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const win = getCurrentWindow();

      if (viewerState.isOpen) {
        if (e.key.toLowerCase() === "f" || e.code === "KeyF") {
          const isFull = await win.isFullscreen();
          await win.setFullscreen(!isFull);
        } else if (e.key === "Escape" || e.key === "Backspace") {
          const isFull = await win.isFullscreen();
          if (isFull) await win.setFullscreen(false);
          setViewerState({ isOpen: false, currentIndex: -1 });
        } else if (e.key === "ArrowDown" || e.key === " ") {
          e.preventDefault();
          setViewerState(prev => ({
            ...prev,
            currentIndex: Math.min(prev.currentIndex + 1, images.length - 1)
          }));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setViewerState(prev => ({
            ...prev,
            currentIndex: Math.max(prev.currentIndex - 1, 0)
          }));
        }
      } else if (isSettingsOpen || isFavoritesOpen) {
        if (e.key === "Escape") {
          setIsSettingsOpen(false);
          setIsFavoritesOpen(false);
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
  }, [viewerState.isOpen, isSettingsOpen, isFavoritesOpen, images.length, goUp, goBack, goForward]);

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
        onOpenFolder={openFolderDialog} 
        onOpenSettings={() => setIsSettingsOpen(true)} 
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onSelectHistory={loadDirectory}
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
        onClose={() => setViewerState({ isOpen: false, currentIndex: -1 })} 
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
    </div>
  );
}

export default App;
