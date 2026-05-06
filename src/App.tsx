import { useState, useEffect, useMemo, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { convertFileSrc } from "@tauri-apps/api/core";
import { openPath } from "@tauri-apps/plugin-opener";
import { useFileSystem } from "./hooks/useFileSystem";
import { useSettings } from "./hooks/useSettings";
import { useHistory } from "./hooks/useHistory";
import { useFavorites } from "./hooks/useFavorites";
import { useSlideshow } from "./hooks/useSlideshow";
import { MenuBar } from "./components/MenuBar";
import { TopBar } from "./components/TopBar";
import { Gallery } from "./components/Gallery";
import { ImageViewer } from "./components/ImageViewer";
import { SettingsModal } from "./components/SettingsModal";
import { FavoritesModal } from "./components/FavoritesModal";
import { SlideIntervalModal } from "./components/SlideIntervalModal";
import { ResizeHandles } from "./components/ResizeHandles";
import { EntryItem, ViewerState } from "./types";
import { VIRTUAL_PATH_FAVORITES, isVirtualPath, convertFavoriteToEntry } from "./utils/virtualPathUtils";
import "./App.css";

function App() {
  const { 
    currentPath, entries, loading, error, canGoBack, canGoForward,
    loadDirectory, searchFolders, openFolderDialog, goUp, goBack, goForward
  } = useFileSystem();

  const {
    isSettingsOpen, setIsSettingsOpen, activeSettingsTab, setActiveSettingsTab,
    dataStoragePath, changeStoragePath, historyRetentionDays, updateHistoryRetention,
    startupFolderType, updateStartupFolderType, slideInterval, updateSlideInterval,
    slideLoop, toggleSlideLoop, viewMode, updateViewMode, readingDirection,
    updateReadingDirection, firstPageIsCover, toggleFirstPageIsCover,
    language, updateLanguage, theme, updateTheme, 
    background, updateBackground, pickBackgroundImage
  } = useSettings();

  const { history, recordHistory, isLoaded: isHistoryLoaded } = useHistory(dataStoragePath, historyRetentionDays);
  const { favorites, isFavorite, toggleFavorite, updateAllFavorites } = useFavorites(dataStoragePath);

  const [viewerState, setViewerState] = useState<ViewerState>({ isOpen: false, currentIndex: -1 });
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isIntervalDialogOpen, setIsIntervalDialogOpen] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const images = useMemo(() => entries.filter(e => !e.is_dir), [entries]);

  // Virtual Entries Conversion
  const virtualEntries = useMemo((): Record<string, EntryItem[]> => {
    return {
      [VIRTUAL_PATH_FAVORITES]: favorites.map(convertFavoriteToEntry),
    };
  }, [favorites]);

  const displayEntries = useMemo(() => {
    if (virtualEntries[currentPath]) return virtualEntries[currentPath];
    return entries;
  }, [currentPath, entries, virtualEntries]);

  // Slideshow Logic
  const { start: startTimer, stop: stopTimer } = useSlideshow(
    { viewMode, firstPageIsCover, totalImages: images.length },
    slideInterval,
    slideLoop,
    (next) => {
      setViewerState(prev => ({
        ...prev,
        currentIndex: typeof next === 'function' ? next(prev.currentIndex) : next
      }));
    }
  );

  // Handle Startup Path
  useEffect(() => {
    if (isHistoryLoaded && !isStarted) {
      if (startupFolderType === "last" && history.length > 0) {
        loadDirectory(history[0].path);
      }
      setIsStarted(true);
    }
  }, [isHistoryLoaded, isStarted, startupFolderType, history, loadDirectory]);

  // Record history
  useEffect(() => {
    if (currentPath && isStarted && !isVirtualPath(currentPath)) {
      recordHistory(currentPath);
    }
  }, [currentPath, recordHistory, isStarted]);

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
      if (e.button === 3) goBack();
      else if (e.button === 4) goForward();
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [goBack, goForward]);

  const startSlideshow = useCallback(async () => {
    if (images.length === 0) return;
    const startIndex = viewerState.currentIndex >= 0 ? viewerState.currentIndex : 0;
    setViewerState({ isOpen: true, currentIndex: startIndex });
    startTimer();
    await getCurrentWindow().setFullscreen(true);
  }, [images.length, viewerState.currentIndex, startTimer]);

  const closeViewer = useCallback(async () => {
    stopTimer();
    const win = getCurrentWindow();
    if (await win.isFullscreen()) await win.setFullscreen(false);
    setViewerState({ isOpen: false, currentIndex: -1 });
  }, [stopTimer]);

  const handleRevealCurrentPath = useCallback(async () => {
    if (currentPath && !isVirtualPath(currentPath)) {
      try {
        await openPath(currentPath);
      } catch (err) {
        console.error("Failed to open current path:", err);
      }
    }
  }, [currentPath]);

  const handleSearch = useCallback((query: string) => {
    if (currentPath && !isVirtualPath(currentPath)) {
      searchFolders(currentPath, query);
    } else if (history.length > 0) {
      // If in virtual view, search from last physical folder
      searchFolders(history[0].path, query);
    }
  }, [currentPath, history, searchFolders]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (viewerState.isOpen) {
        if (e.key.toLowerCase() === "f") {
          const win = getCurrentWindow();
          const isFull = await win.isFullscreen();
          await win.setFullscreen(!isFull);
        } else if (e.key === "Escape" || e.key === "Backspace") {
          await closeViewer();
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
  }, [viewerState.isOpen, isSettingsOpen, isFavoritesOpen, isIntervalDialogOpen, goUp, goBack, goForward, closeViewer, viewMode, updateViewMode]);

  const handleEntryClick = (entry: EntryItem) => {
    if (entry.is_dir) {
      loadDirectory(entry.path);
    } else {
      const idx = images.findIndex(img => img.path === entry.path);
      setViewerState({ isOpen: true, currentIndex: idx });
    }
  };

  const backgroundStyle = useMemo(() => {
    if (!background.path) return {};
    const styles: React.CSSProperties = {
      backgroundImage: `url("${convertFileSrc(background.path)}")`,
      opacity: background.opacity,
      filter: `blur(${background.blur}px)`,
    };
    if (background.style === "cover") {
      styles.backgroundSize = "cover";
      styles.backgroundPosition = "center";
      styles.backgroundRepeat = "no-repeat";
    } else if (background.style === "contain") {
      styles.backgroundSize = "contain";
      styles.backgroundPosition = "center";
      styles.backgroundRepeat = "no-repeat";
    } else if (background.style === "tile") {
      styles.backgroundSize = "auto";
      styles.backgroundRepeat = "repeat";
    }
    return styles;
  }, [background.path, background.opacity, background.blur, background.style]);

  return (
    <div className={`app-container ${background.path ? "has-background" : ""}`}>
      <ResizeHandles />
      
      {background.path && (
        <div className="app-background-layer" style={backgroundStyle}></div>
      )}

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
        onRevealCurrentPath={handleRevealCurrentPath}
      />

      <TopBar 
        currentPath={currentPath} 
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onNavigate={loadDirectory}
        onGoUp={goUp}
        onGoBack={goBack}
        onGoForward={goForward}
        onSearch={handleSearch}
        onExitSearch={goBack}
      />

      {error && <div className="error">{error}</div>}

      <Gallery 
        entries={displayEntries} 
        loading={loading} 
        currentPath={currentPath} 
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        onEntryClick={handleEntryClick} 
        onRefresh={() => loadDirectory(currentPath)}
        onSetBackground={(path) => updateBackground({ path })}
      />

      <ImageViewer 
        images={images} 
        currentIndex={viewerState.currentIndex} 
        viewMode={viewMode}
        readingDirection={readingDirection}
        firstPageIsCover={firstPageIsCover}
        onClose={closeViewer} 
        onNavigate={(idx) => setViewerState(prev => ({ ...prev, currentIndex: idx }))}
        onManualInteraction={stopTimer}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        activeTab={activeSettingsTab}
        dataStoragePath={dataStoragePath}
        historyRetentionDays={historyRetentionDays}
        startupFolderType={startupFolderType}
        language={language}
        theme={theme}
        background={background}
        onClose={() => setIsSettingsOpen(false)}
        onTabChange={setActiveSettingsTab}
        onChangeStoragePath={changeStoragePath}
        onUpdateHistoryRetention={updateHistoryRetention}
        onUpdateStartupFolderType={updateStartupFolderType}
        onUpdateLanguage={updateLanguage}
        onUpdateTheme={updateTheme}
        onUpdateBackground={updateBackground}
        onPickBackgroundImage={pickBackgroundImage}
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
