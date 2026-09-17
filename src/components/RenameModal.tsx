import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getNameAndExtension, isValidFileName } from "../utils/fileUtils";
import "./RenameModal.css";

interface RenameModalProps {
  isOpen: boolean;
  currentName: string;
  isDir?: boolean;
  onRename: (newName: string) => Promise<void>;
  onClose: () => void;
}

/**
 * ファイル/フォルダのリネームモーダルダイアログ
 * ビューワー画面や各種UIから利用可能な汎用リネームコンポーネント
 */
export function RenameModal({
  isOpen,
  currentName,
  isDir = false,
  onRename,
  onClose,
}: RenameModalProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState(currentName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(currentName);
      setIsSubmitting(false);
      setTimeout(() => {
        if (!inputRef.current) return;
        inputRef.current.focus();
        // 拡張子を除いたベース名のみを選択
        const { baseName } = getNameAndExtension(currentName);
        if (!isDir && baseName.length > 0 && baseName !== currentName) {
          inputRef.current.setSelectionRange(0, baseName.length);
        } else {
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, currentName, isDir]);

  const trimmed = value.trim();
  const isValid = isValidFileName(trimmed);
  const isChanged = trimmed !== currentName;

  const handleOk = useCallback(async () => {
    if (!isValid || isSubmitting) return;
    if (!isChanged) {
      onClose();
      return;
    }

    try {
      setIsSubmitting(true);
      await onRename(trimmed);
      onClose();
    } catch (e) {
      // エラー表示は親またはダイアログ側で処理
      setIsSubmitting(false);
    }
  }, [isValid, isSubmitting, isChanged, onRename, trimmed, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation();
      if (e.nativeEvent) {
        e.nativeEvent.stopImmediatePropagation();
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handleOk();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [handleOk, onClose]
  );

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal rename-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>{t('context_menu.rename', { defaultValue: '名前を変更' })}</h2>
          <button className="close-button" onClick={onClose} aria-label={t('common.close')}>
            &times;
          </button>
        </div>

        <div className="settings-body rename-modal-body">
          <input
            ref={inputRef}
            className="rename-input-field"
            value={value}
            disabled={isSubmitting}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {!isValid && value.length > 0 && (
            <div className="rename-error-hint">
              {t('common.error_rename_invalid', { defaultValue: '無効なファイル名です（\\ / : * ? " < > | は使用できません）' })}
            </div>
          )}
        </div>

        <div className="settings-footer">
          <button className="settings-button" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel', { defaultValue: 'キャンセル' })}
          </button>
          <button
            className="settings-button primary"
            onClick={handleOk}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? t('common.loading', { defaultValue: '処理中...' }) : t('common.ok', { defaultValue: 'OK' })}
          </button>
        </div>
      </div>
    </div>
  );
}
