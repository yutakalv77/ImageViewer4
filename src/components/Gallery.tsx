import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { EntryItem } from "../types";
import { EntryCard } from "./EntryCard";
import "./Gallery.css";
import { ContextMenu } from "./ContextMenu";
import { useGalleryNavigation } from "../hooks/useGalleryNavigation";
import { useFileSystemContext } from "../context/FileSystemContext";
import { useSettingsContext } from "../context/SettingsContext";
import { THUMBNAIL_SIZE_STEP } from "../hooks/useSettings";

interface GalleryProps {
  onEntryClick: (entry: EntryItem) => void;
}

export function Gallery({ 
  onEntryClick
}: GalleryProps) {
  const { t } = useTranslation();
  
  const {
    currentPath, displayEntries, loading, isFavorite, toggleFavorite, loadDirectory
  } = useFileSystemContext();

  const {
    updateBackground, thumbnailSize, updateThumbnailSize
  } = useSettingsContext();

  const {
    selectedIndex,
    setSelectedIndex,
    editingIndex,
    setEditingIndex,
    galleryRef,
    reset
  } = useGalleryNavigation(displayEntries, onEntryClick);

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, entry: EntryItem, index: number } | null>(null);

  // Ctrl + Mouse Wheel resizing
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? THUMBNAIL_SIZE_STEP : -THUMBNAIL_SIZE_STEP;
        updateThumbnailSize(delta);
      }
    };

    const galleryEl = galleryRef.current;
    if (galleryEl) {
      galleryEl.addEventListener("wheel", handleWheel, { passive: false });
    }
    return () => {
      if (galleryEl) {
        galleryEl.removeEventListener("wheel", handleWheel);
      }
    };
  }, [galleryRef, updateThumbnailSize]);

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
    const entry = displayEntries[index];
    setEditingIndex(-1);
    
    if (!newName || newName === entry.name) return;

    try {
      const oldPath = entry.path;
      const separator = oldPath.includes('\\') ? '\\' : '/';
      const pathParts = oldPath.split(separator);
      pathParts.pop();
      const newPath = [...pathParts, newName].join(separator);

      await invoke("rename_entry", { oldPath, newPath });
      loadDirectory(currentPath, true); // Refresh without adding to backStack
    } catch (err) {
      console.error("Failed to rename:", err);
      alert(t('common.error_rename'));
    }
  }, [displayEntries, currentPath, loadDirectory, setEditingIndex, t]);

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
    { label: t('context_menu.reveal'), onClick: () => handleReveal(contextMenu.entry.path) },
    { label: t('context_menu.copy_path'), onClick: () => copyToClipboard(contextMenu.entry.path) },
    { 
      label: isFavorite(contextMenu.entry.path) ? t('context_menu.fav_remove') : t('context_menu.fav_add'), 
      onClick: () => toggleFavorite(contextMenu.entry.path) 
    },
    ...(!contextMenu.entry.is_dir ? [
      { label: t('context_menu.set_bg'), onClick: () => updateBackground({ path: contextMenu.entry.path }) }
    ] : []),
    { separator: true, label: t('context_menu.rename'), onClick: () => setEditingIndex(contextMenu.index) },
  ] : [];

  return (
    <div className="main-content" onContextMenu={(e) => e.preventDefault()}>
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      )}

      <div 
        className="gallery" 
        ref={galleryRef}
        style={{ '--thumbnail-size': `${thumbnailSize}px` } as React.CSSProperties}
      >
        {displayEntries.map((entry, idx) => (
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
        {!loading && displayEntries.length === 0 && currentPath && (
          <div className="empty-msg">{t('common.empty_gallery')}</div>
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
