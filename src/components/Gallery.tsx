import { useState, useEffect, useRef } from "react";
import { EntryItem } from "../types";
import { EntryCard } from "./EntryCard";

interface GalleryProps {
  entries: EntryItem[];
  loading: boolean;
  currentPath: string;
  onEntryClick: (entry: EntryItem) => void;
}

export function Gallery({ entries, loading, currentPath, onEntryClick }: GalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Reset selection when path changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [currentPath]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't handle if some overlay is open (viewer, settings)
      if (document.querySelector('.viewer-overlay') || document.querySelector('.settings-overlay')) {
        return;
      }

      if (entries.length === 0) return;

      let nextIndex = selectedIndex;

      const getColumnCount = () => {
        if (!galleryRef.current) return 0;
        const style = window.getComputedStyle(galleryRef.current);
        const gridTemplateColumns = style.getPropertyValue('grid-template-columns');
        // split by space and filter out empty strings (e.g. from multiple spaces or trailing space)
        return gridTemplateColumns.split(/\s+/).filter(c => c !== '').length;
      };

      if (e.key === "ArrowRight") {
        if (selectedIndex === -1) {
          nextIndex = 0;
        } else {
          nextIndex = Math.min(selectedIndex + 1, entries.length - 1);
        }
      } else if (e.key === "ArrowLeft") {
        if (selectedIndex === -1) {
          nextIndex = 0;
        } else {
          nextIndex = Math.max(selectedIndex - 1, 0);
        }
      } else if (e.key === "ArrowDown") {
        const cols = getColumnCount();
        if (selectedIndex === -1) {
          nextIndex = 0;
        } else {
          nextIndex = Math.min(selectedIndex + cols, entries.length - 1);
        }
      } else if (e.key === "ArrowUp") {
        const cols = getColumnCount();
        if (selectedIndex === -1) {
          nextIndex = 0;
        } else {
          nextIndex = Math.max(selectedIndex - cols, 0);
        }
      } else if (e.key === "Enter") {
        if (selectedIndex >= 0) {
          onEntryClick(entries[selectedIndex]);
        }
        return;
      } else {
        return;
      }

      if (nextIndex !== selectedIndex) {
        e.preventDefault();
        setSelectedIndex(nextIndex);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [entries, selectedIndex, onEntryClick]);

  // Scroll into view when selection changes
  useEffect(() => {
    if (selectedIndex >= 0 && galleryRef.current) {
      const selectedEl = galleryRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        // use scrollIntoView with block: 'nearest' to avoid unnecessary scrolling if already in view
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="main-content">
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
            onClick={() => {
              setSelectedIndex(idx);
              onEntryClick(entry);
            }} 
          />
        ))}
        {!loading && entries.length === 0 && currentPath && (
          <div className="empty-msg">No images or folders found.</div>
        )}
      </div>
    </div>
  );
}
