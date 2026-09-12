import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { EntryItem } from "../types";
import { ScrollTarget } from "../hooks/useScrollManager";
import { EntryCard } from "./EntryCard";
import "./Gallery.css";
import { ContextMenu } from "./ContextMenu";
import { useGalleryNavigation } from "../hooks/useGalleryNavigation";
import { THUMBNAIL_SIZE_STEP } from "../hooks/useSettings";

interface GalleryProps {
  currentPath: string;
  displayEntries: EntryItem[];
  loading: boolean;
  thumbnailSize: number;
  isFavorite: (path: string) => boolean;
  scrollTarget?: ScrollTarget;
  onSaveScrollPosition?: (path: string, scrollTop: number) => void;
  onEntryClick: (entry: EntryItem) => void;
  onRenameEntry: (oldPath: string, newName: string) => Promise<void>;
  onToggleFavorite: (path: string) => void;
  onUpdateBackground: (updates: { path: string }) => void;
  onShowInfo: (path: string) => void;
  onUpdateThumbnailSize: (delta: number) => void;
}

export function Gallery({ 
  currentPath,
  displayEntries,
  loading,
  thumbnailSize,
  isFavorite,
  scrollTarget,
  onSaveScrollPosition,
  onEntryClick,
  onRenameEntry,
  onToggleFavorite,
  onUpdateBackground,
  onShowInfo,
  onUpdateThumbnailSize
}: GalleryProps) {
  const { t } = useTranslation();
  const mainContentRef = useRef<HTMLDivElement>(null);
  const isRestoringRef = useRef(false);
  const lastRestoredNavIdRef = useRef<number>(-1);
  
  const {
    selectedIndex,
    setSelectedIndex,
    editingIndex,
    setEditingIndex,
    galleryRef,
    reset
  } = useGalleryNavigation(displayEntries, onEntryClick);

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, entry: EntryItem, index: number } | null>(null);

  // Save scroll position on user scroll
  const handleScroll = useCallback(() => {
    if (isRestoringRef.current) return;
    if (!mainContentRef.current || !currentPath || !onSaveScrollPosition) return;
    onSaveScrollPosition(currentPath, mainContentRef.current.scrollTop);
  }, [currentPath, onSaveScrollPosition]);

  // Save scroll position when currentPath changes or unmounts
  useEffect(() => {
    return () => {
      if (mainContentRef.current && currentPath && !isRestoringRef.current && onSaveScrollPosition) {
        onSaveScrollPosition(currentPath, mainContentRef.current.scrollTop);
      }
    };
  }, [currentPath, onSaveScrollPosition]);

  // Restore scroll position after loading completes for each navigation
  useEffect(() => {
    const container = mainContentRef.current;
    if (!container) return;

    const navId = scrollTarget?.id ?? 0;
    const targetScrollTop = scrollTarget?.scrollTop ?? 0;

    if (loading) {
      isRestoringRef.current = true;
      if (targetScrollTop === 0) {
        container.scrollTop = 0;
      }
      return;
    }

    // If this navigation has already been restored, do not re-apply on subsequent render updates
    if (lastRestoredNavIdRef.current === navId && navId > 0) {
      return;
    }

    isRestoringRef.current = true;
    let rafId: number;
    let attempts = 0;
    const maxAttempts = 15;

    const finalizeScroll = () => {
      lastRestoredNavIdRef.current = navId;
      // Double RAF ensures that DOM layout and synthetic scroll events have fully settled
      rafId = requestAnimationFrame(() => {
        rafId = requestAnimationFrame(() => {
          isRestoringRef.current = false;
        });
      });
    };

    const applyScroll = () => {
      if (!mainContentRef.current) {
        isRestoringRef.current = false;
        return;
      }
      const el = mainContentRef.current;

      if (targetScrollTop <= 0) {
        el.scrollTop = 0;
        finalizeScroll();
        return;
      }

      const canScroll = el.scrollHeight - el.clientHeight >= targetScrollTop;
      if (canScroll || attempts >= maxAttempts) {
        el.scrollTop = targetScrollTop;
        finalizeScroll();
      } else {
        attempts++;
        rafId = requestAnimationFrame(applyScroll);
      }
    };

    rafId = requestAnimationFrame(applyScroll);

    return () => {
      cancelAnimationFrame(rafId);
      isRestoringRef.current = false;
    };
  }, [currentPath, loading, displayEntries, scrollTarget?.id, scrollTarget?.scrollTop]);

  // Ctrl + Mouse Wheel resizing
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? THUMBNAIL_SIZE_STEP : -THUMBNAIL_SIZE_STEP;
        onUpdateThumbnailSize(delta);
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
  }, [galleryRef, onUpdateThumbnailSize]);

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
    await onRenameEntry(entry.path, newName);
  }, [displayEntries, onRenameEntry, setEditingIndex]);

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
      onClick: () => onToggleFavorite(contextMenu.entry.path) 
    },
    ...(!contextMenu.entry.is_dir ? [
      { label: t('context_menu.set_bg'), onClick: () => onUpdateBackground({ path: contextMenu.entry.path }) },
      { label: t('context_menu.show_info'), onClick: () => onShowInfo(contextMenu.entry.path) }
    ] : []),
    { separator: true, label: t('context_menu.rename'), onClick: () => setEditingIndex(contextMenu.index) },
  ] : [];

  return (
    <div 
      className="main-content" 
      ref={mainContentRef} 
      onScroll={handleScroll} 
      onContextMenu={(e) => e.preventDefault()}
    >
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
