import { useState, useEffect, useRef } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { EntryItem } from "../types";

interface EntryCardProps {
  entry: EntryItem;
  isSelected?: boolean;
  isEditing?: boolean;
  isFavorite?: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onRenameComplete: (newName: string) => void;
  onRenameCancel: () => void;
}

export function EntryCard({ 
  entry, 
  isSelected, 
  isEditing, 
  isFavorite,
  onClick, 
  onContextMenu,
  onRenameComplete,
  onRenameCancel
}: EntryCardProps) {
  const [tempName, setLocalName] = useState(entry.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setLocalName(entry.name);
      setTimeout(() => inputRef.current?.focus(), 50);
      inputRef.current?.select();
    }
  }, [isEditing, entry.name]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onRenameComplete(tempName);
    } else if (e.key === "Escape") {
      onRenameCancel();
    }
  };

  return (
    <div 
      className={`entry-card ${entry.is_dir ? 'is-dir' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div 
        className="thumbnail-container" 
        title={entry.is_dir ? entry.name : undefined}
      >
        {entry.thumbnail_path ? (
          <img src={convertFileSrc(entry.thumbnail_path)} alt={entry.name} loading="lazy" />
        ) : (
          <div className="no-thumbnail">Folder</div>
        )}
        {entry.is_dir && <div className="folder-icon">📁</div>}
        {isFavorite && <div className="favorite-star" title="お気に入り">⭐</div>}
      </div>
      
      <div className="entry-name-container">
        {isEditing ? (
          <input
            ref={inputRef}
            className="rename-input"
            value={tempName}
            onChange={(e) => setLocalName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => onRenameComplete(tempName)}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="entry-name" title={entry.name}>{entry.name}</div>
        )}
      </div>
    </div>
  );
}
