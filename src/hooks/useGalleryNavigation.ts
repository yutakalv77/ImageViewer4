import { useState, useEffect, useRef, useCallback } from "react";
import { EntryItem } from "../types";

export function useGalleryNavigation(entries: EntryItem[], onEntryClick: (entry: EntryItem) => void) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [editingIndex, setEditingIndex] = useState(-1);
  const galleryRef = useRef<HTMLDivElement>(null);

  const reset = useCallback(() => {
    setSelectedIndex(-1);
    setEditingIndex(-1);
  }, []);

  // Ensure selectedIndex is within bounds if entries change
  useEffect(() => {
    if (selectedIndex >= entries.length) {
      setSelectedIndex(entries.length > 0 ? entries.length - 1 : -1);
    }
  }, [entries.length, selectedIndex]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (editingIndex !== -1) return;
    if (document.querySelector('.viewer-overlay') || document.querySelector('.settings-overlay') || document.querySelector('.image-info-overlay')) return;
    if (!entries || entries.length === 0) return;

    let nextIndex = selectedIndex;

    const getColumnCount = () => {
      if (!galleryRef.current) return 1;
      const style = window.getComputedStyle(galleryRef.current);
      const gridTemplateColumns = style.getPropertyValue('grid-template-columns');
      const cols = gridTemplateColumns.split(/\s+/).filter(c => c !== '').length;
      return Math.max(1, cols);
    };

    if (e.key === "ArrowRight") {
      nextIndex = selectedIndex === -1 ? 0 : Math.min(selectedIndex + 1, entries.length - 1);
    } else if (e.key === "ArrowLeft") {
      nextIndex = selectedIndex === -1 ? 0 : Math.max(selectedIndex - 1, 0);
    } else if (e.key === "ArrowDown") {
      const cols = getColumnCount();
      nextIndex = selectedIndex === -1 ? 0 : Math.min(selectedIndex + cols, entries.length - 1);
    } else if (e.key === "ArrowUp") {
      const cols = getColumnCount();
      nextIndex = selectedIndex === -1 ? 0 : Math.max(selectedIndex - cols, 0);
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && selectedIndex < entries.length && entries[selectedIndex]) {
        onEntryClick(entries[selectedIndex]);
      }
      return;
    } else if (e.key === "F2") {
      if (selectedIndex >= 0 && selectedIndex < entries.length) {
        setEditingIndex(selectedIndex);
      }
      return;
    } else {
      return;
    }

    if (nextIndex !== selectedIndex) {
      e.preventDefault();
      setSelectedIndex(nextIndex);
    }
  }, [entries, selectedIndex, editingIndex, onEntryClick]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (selectedIndex >= 0 && galleryRef.current && galleryRef.current.children[selectedIndex]) {
      const selectedEl = galleryRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl && typeof selectedEl.scrollIntoView === 'function') {
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  return {
    selectedIndex,
    setSelectedIndex,
    editingIndex,
    setEditingIndex,
    galleryRef,
    reset
  };
}
