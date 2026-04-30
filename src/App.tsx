import { useState, useEffect, useMemo } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useFileSystem } from "./hooks/useFileSystem";
import { useSettings } from "./hooks/useSettings";
import { useHistory } from "./hooks/useHistory";
import { MenuBar } from "./components/MenuBar";
import { TopBar } from "./components/TopBar";
import { Gallery } from "./components/Gallery";
import { ImageViewer } from "./components/ImageViewer";
import { SettingsModal } from "./components/SettingsModal";
import { EntryItem, ViewerState } from "./types";
import "./App.css";

function App() {
  const { 
    currentPath, 
    entries, 
    loading, 
    error, 
    loadDirectory, 
    openFolderDialog, 
    goUp 
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

  const [viewerState, setViewerState] = useState<ViewerState>({ 
    isOpen: false, 
    currentIndex: -1 
  });

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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (viewerState.isOpen) {
        if (e.key === "ArrowDown" || e.key === " ") {
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
        } else if (e.key === "Escape") {
          setViewerState({ isOpen: false, currentIndex: -1 });
        }
      } else if (isSettingsOpen) {
        if (e.key === "Escape") {
          setIsSettingsOpen(false);
        }
      } else {
        if (e.key === "Escape" || e.key === "Backspace") {
          goUp();
        }
      }

      if (e.key.toLowerCase() === "f") {
        const win = getCurrentWindow();
        const isFull = await win.isFullscreen();
        await win.setFullscreen(!isFull);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewerState.isOpen, isSettingsOpen, images.length, goUp]);

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
      <MenuBar 
        history={history}
        onOpenFolder={openFolderDialog} 
        onOpenSettings={() => setIsSettingsOpen(true)} 
        onSelectHistory={loadDirectory}
      />

      <TopBar currentPath={currentPath} />

      {error && <div className="error">{error}</div>}

      <Gallery 
        entries={entries} 
        loading={loading} 
        currentPath={currentPath} 
        onEntryClick={handleEntryClick} 
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
    </div>
  );
}

export default App;
