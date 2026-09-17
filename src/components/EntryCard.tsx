import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { EntryItem } from "../types";
import { useThumbnail } from "../hooks/useThumbnail";
import { getNameAndExtension } from "../utils/fileUtils";
import "./EntryCard.css";

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
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [tempName, setLocalName] = useState(entry.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);

  const { thumbSrc, isLoading, hasError, onError } = useThumbnail(entry, cardRef);

  useEffect(() => {
    setLocalName(entry.name);
  }, [entry.name]);

  useEffect(() => {
    if (isEditing) {
      isSubmittingRef.current = false;
      setLocalName(entry.name);
      setTimeout(() => {
        if (!inputRef.current) return;
        inputRef.current.focus();
        // 拡張子を除いたベース名のみを選択（フォルダ以外）
        const { baseName } = getNameAndExtension(entry.name);
        if (!entry.is_dir && baseName.length > 0 && baseName !== entry.name) {
          inputRef.current.setSelectionRange(0, baseName.length);
        } else {
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isEditing, entry.name, entry.is_dir]);

  const handleComplete = () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    onRenameComplete(tempName);
  };

  const handleCancel = () => {
    isSubmittingRef.current = true;
    setLocalName(entry.name);
    onRenameCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      handleComplete();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };


  const isArchive = !!entry.is_archive;
  const archiveLabel = entry.name.toLowerCase().endsWith('.cbz') ? 'CBZ' : 'ZIP';

  return (
    <div 
      ref={cardRef}
      className={`entry-card ${entry.is_dir ? 'is-dir' : ''} ${isArchive ? 'is-archive' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div 
        className={`thumbnail-container ${isLoading ? 'is-loading' : ''}`} 
        title={entry.is_dir || isArchive ? entry.name : undefined}
      >
        {thumbSrc && !hasError ? (
          <img 
            src={thumbSrc} 
            alt={entry.name} 
            loading="lazy" 
            decoding="async"
            onError={onError}
          />
        ) : (
          <div className="no-thumbnail">
            {isLoading ? "" : (entry.is_dir ? t('common.folder') : isArchive ? "📦" : "🖼️")}
          </div>
        )}
        {entry.is_dir && <div className="folder-icon">📁</div>}
        {isArchive && <div className="archive-badge" title="Archive">📦 {archiveLabel}</div>}
        {isFavorite && <div className="favorite-star" title={t('favorites.label')}>⭐</div>}
      </div>

      
      <div className="entry-name-container">
        {isEditing ? (
          <input
            ref={inputRef}
            className="rename-input"
            value={tempName}
            onChange={(e) => setLocalName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleComplete}

            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="entry-name" title={entry.name}>{entry.name}</div>
        )}
      </div>
    </div>
  );
}
