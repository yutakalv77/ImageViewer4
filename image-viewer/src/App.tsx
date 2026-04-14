import { useState, useEffect } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./App.css";

interface EntryItem {
  name: string;
  path: string;
  is_dir: boolean;
  thumbnail_path: string | null;
}

function App() {
  const [currentPath, setCurrentPath] = useState("");
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    currentIndex: number;
  }>({ isOpen: false, currentIndex: -1 });

  const loadDirectory = async (path: string) => {
    if (!path) return;
    setLoading(true);
    try {
      const result: EntryItem[] = await invoke("get_directory_entries", { path });
      setEntries(result);
      setError(null);
      setCurrentPath(path);
    } catch (e: any) {
      setError(e.toString());
    } finally {
      setLoading(false);
    }
  };

  const goUp = () => {
    if (!currentPath) return;
    // Simple parent directory logic for Windows/Unix
    const separator = currentPath.includes("\\") ? "\\" : "/";
    const parts = currentPath.split(separator).filter(Boolean);
    if (parts.length > 1) {
      const parent = currentPath.substring(0, currentPath.lastIndexOf(separator));
      loadDirectory(parent);
    } else if (parts.length === 1 && currentPath.includes(separator)) {
      // Handle drive root case like C:\
      const driveRoot = parts[0] + separator;
      if (currentPath !== driveRoot) {
        loadDirectory(driveRoot);
      }
    }
  };

  const images = entries.filter(e => !e.is_dir);

  useEffect(() => {
    // Setup drag and drop
    const unlisten = getCurrentWindow().onDragDropEvent((event) => {
      if (event.payload.type === 'drop') {
        const droppedPaths = event.payload.paths;
        if (droppedPaths.length > 0) {
          loadDirectory(droppedPaths[0]);
        }
      }
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

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
      } else {
        // Navigation shortcuts when viewer is closed
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
  }, [viewerState.isOpen, images.length, currentPath]);

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
      <header className="top-bar">
        <input
          type="text"
          value={currentPath}
          onChange={(e) => setCurrentPath(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadDirectory(currentPath)}
          placeholder="Folder path or drop a folder here"
        />
        <button onClick={() => loadDirectory(currentPath)}>Go</button>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="main-content">
        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        )}

        <div className="gallery">
          {entries.map((entry, idx) => (
            <div 
              key={idx} 
              className={`entry-card ${entry.is_dir ? 'is-dir' : ''}`}
              onClick={() => handleEntryClick(entry)}
            >
              <div className="thumbnail-container">
                {entry.thumbnail_path ? (
                  <img src={convertFileSrc(entry.thumbnail_path)} alt={entry.name} loading="lazy" />
                ) : (
                  <div className="no-thumbnail">Folder</div>
                )}
                {entry.is_dir && <div className="folder-icon">📁</div>}
              </div>
              <div className="entry-name" title={entry.name}>{entry.name}</div>
            </div>
          ))}
          {!loading && entries.length === 0 && currentPath && (
            <div className="empty-msg">No images or folders found.</div>
          )}
        </div>
      </div>

      {viewerState.isOpen && viewerState.currentIndex >= 0 && (
        <div className="viewer-overlay" onClick={() => setViewerState({ isOpen: false, currentIndex: -1 })}>
          <img 
            src={convertFileSrc(images[viewerState.currentIndex].path)} 
            alt="Full View" 
            onClick={(e) => e.stopPropagation()}
          />
          <div className="viewer-info">
            {viewerState.currentIndex + 1} / {images.length} : {images[viewerState.currentIndex].name}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
