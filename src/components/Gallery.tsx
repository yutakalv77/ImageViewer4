import { EntryItem } from "../types";
import { EntryCard } from "./EntryCard";

interface GalleryProps {
  entries: EntryItem[];
  loading: boolean;
  currentPath: string;
  onEntryClick: (entry: EntryItem) => void;
}

export function Gallery({ entries, loading, currentPath, onEntryClick }: GalleryProps) {
  return (
    <div className="main-content">
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      )}

      <div className="gallery">
        {entries.map((entry, idx) => (
          <EntryCard 
            key={`${entry.path}-${idx}`} 
            entry={entry} 
            onClick={() => onEntryClick(entry)} 
          />
        ))}
        {!loading && entries.length === 0 && currentPath && (
          <div className="empty-msg">No images or folders found.</div>
        )}
      </div>
    </div>
  );
}
