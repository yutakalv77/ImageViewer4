import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { EntryItem } from "../types";
import { EntryCard } from "./EntryCard";
import { ContextMenu } from "./ContextMenu";
import { useGalleryNavigation } from "../hooks/useGalleryNavigation";

interface GalleryProps {
  entries: EntryItem[];
  loading: boolean;
  currentPath: string;
  isFavorite: (path: string) => boolean;
  onToggleFavorite: (path: string) => void;
  onEntryClick: (entry: EntryItem) => void;
  onRefresh: () => void;
}

export function Gallery({ 
  entries, 
  loading, 
  currentPath, 
  isFavorite,
  onToggleFavorite,
  onEntryClick, 
  onRefresh 
}: GalleryProps) {
  const {
    selectedIndex,
    setSelectedIndex,
    editingIndex,
    setEditingIndex,
    galleryRef,
    reset
  } = useGalleryNavigation(entries, onEntryClick);

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, entry: EntryItem, index: number } | null>(null);

  // Reset navigation state when path changes
  useEffect(() => {
    reset();
    setContextMenu(null);
  }, [currentPath, reset]);

  const handleContextMenu = (e: React.MouseEvent, entry: EntryItem, index: number) => {
    e.preventDefault();
    setSelectedIndex(index);
    setContextMenu({ x: e.clientX, y: e.clientY, entry, index });
  };

  const handleRename = useCallback(async (index: number, newName: string) => {
    const entry = entries[index];
    setEditingIndex(-1);
    
    if (!newName || newName === entry.name) return;

    try {
      const oldPath = entry.path;
      const separator = oldPath.includes('\\') ? '\\' : '/';
      const pathParts = oldPath.split(separator);
      pathParts.pop();
      const newPath = [...pathParts, newName].join(separator);

      await invoke("rename_entry", { oldPath, newPath });
      onRefresh();
    } catch (err) {
      console.error("Failed to rename:", err);
      alert("名前の変更に失敗しました");
    }
  }, [entries, onRefresh, setEditingIndex]);

  const copyToClipboard = async (path: string) => {
    try {
      await writeText(path);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleReveal = async (path: string) => {
    try {
      await revealItemInDir(path);
    } catch (err) {
      console.error("Failed to reveal:", err);
    }
  };

  const menuItems = contextMenu ? [
    { label: "エクスプローラーで表示", onClick: () => handleReveal(contextMenu.entry.path) },
    { label: "クリップボードにコピー", onClick: () => copyToClipboard(contextMenu.entry.path) },
    { 
      label: isFavorite(contextMenu.entry.path) ? "お気に入りから削除" : "お気に入りに追加", 
      onClick: () => onToggleFavorite(contextMenu.entry.path) 
    },
    { separator: true, label: "名前を変更", onClick: () => setEditingIndex(contextMenu.index) },
  ] : [];

  return (
    <div className="main-content" onContextMenu={(e) => e.preventDefault()}>
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      )}

      <div className="gallery" ref={galleryRef}>
        {entries.map((entry, idx) => (
          <EntryCard 
            key={`${entry.path}-${idx}`} 
            entry={entry} 
            isSelected={idx === selectedIndex}
            isEditing={idx === editingIndex}
            isFavorite={isFavorite(entry.path)}
            onClick={() => {
              setSelectedIndex(idx);
              onEntryClick(entry);
            }} 
            onContextMenu={(e) => handleContextMenu(e, entry, idx)}
            onRenameComplete={(newName) => handleRename(idx, newName)}
            onRenameCancel={() => setEditingIndex(-1)}
          />
        ))}
        {!loading && entries.length === 0 && currentPath && (
          <div className="empty-msg">No images or folders found.</div>
        )}
      </div>

      {contextMenu && (
        <ContextMenu 
          x={contextMenu.x} 
          y={contextMenu.y} 
          items={menuItems} 
          onClose={() => setContextMenu(null)} 
        />
      )}
    </div>
  );
}
