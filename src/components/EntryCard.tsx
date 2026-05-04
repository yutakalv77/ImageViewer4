import { convertFileSrc } from "@tauri-apps/api/core";
import { EntryItem } from "../types";

interface EntryCardProps {
  entry: EntryItem;
  isSelected?: boolean;
  onClick: () => void;
}

export function EntryCard({ entry, isSelected, onClick }: EntryCardProps) {
  return (
    <div 
      className={`entry-card ${entry.is_dir ? 'is-dir' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
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
  );
}
