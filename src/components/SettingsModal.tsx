import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StorageSettings } from "./settings/StorageSettings";
import { HistorySettings } from "./settings/HistorySettings";
import { GeneralSettings } from "./settings/GeneralSettings";
import { EverythingSettings } from "./settings/EverythingSettings";
import { BackgroundSettings, StartupFolderType, ThemeMode } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  activeTab: string;
  dataStoragePath: string;
  historyRetentionDays: number;
  startupFolderType: StartupFolderType;
  language: string;
  theme: ThemeMode;
  background: BackgroundSettings;
  everythingEnabled: boolean;
  everythingMaxResults: number;
  everythingCliPath: string;
  onClose: () => void;
  onTabChange: (tab: string) => void;
  onChangeStoragePath: () => void;
  onUpdateHistoryRetention: (days: number) => void;
  onUpdateStartupFolderType: (type: StartupFolderType) => void;
  onUpdateLanguage: (lang: string) => void;
  onUpdateTheme: (theme: ThemeMode) => void;
  onUpdateBackground: (updates: Partial<BackgroundSettings>) => void;
  onPickBackgroundImage: () => void;
  onUpdateEverythingEnabled: (enabled: boolean) => void;
  onUpdateEverythingMaxResults: (count: number) => void;
  onUpdateEverythingCliPath: (path: string) => void;
}

export function SettingsModal({
  isOpen,
  activeTab,
  dataStoragePath,
  historyRetentionDays,
  startupFolderType,
  language,
  theme,
  background,
  everythingEnabled,
  everythingMaxResults,
  everythingCliPath,
  onClose,
  onTabChange,
  onChangeStoragePath,
  onUpdateHistoryRetention,
  onUpdateStartupFolderType,
  onUpdateLanguage,
  onUpdateTheme,
  onUpdateBackground,
  onPickBackgroundImage,
  onUpdateEverythingEnabled,
  onUpdateEverythingMaxResults,
  onUpdateEverythingCliPath
}: SettingsModalProps) {
  const { t } = useTranslation();
  
  // Position and Size State
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: 700, h: 500 });
  const [isInitialized, setIsInitialized] = useState(false);
  
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  
  const isResizing = useRef<string | null>(null);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // Reset position to center when opened
  useEffect(() => {
    if (isOpen && !isInitialized) {
      const x = (window.innerWidth - size.w) / 2;
      const y = (window.innerHeight - size.h) / 2;
      setPos({ x, y });
      setIsInitialized(true);
    }
    if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen, isInitialized, size.w, size.h]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  const handleResizeStart = (e: React.MouseEvent, dir: string) => {
    e.stopPropagation();
    isResizing.current = dir;
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging.current) {
      setPos({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    } else if (isResizing.current) {
      const dx = e.clientX - resizeStart.current.x;
      const dy = e.clientY - resizeStart.current.y;
      
      setSize(prev => {
        const next = { ...prev };
        if (isResizing.current?.includes('e')) next.w = Math.max(400, resizeStart.current.w + dx);
        if (isResizing.current?.includes('s')) next.h = Math.max(300, resizeStart.current.h + dy);
        return next;
      });
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    isResizing.current = null;
  }, []);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isOpen, handleMouseMove, handleMouseUp]);

  if (!isOpen) return null;

  return (
    <div className="settings-window-overlay">
      <div 
        className="settings-modal draggable-window" 
        style={{ 
          left: `${pos.x}px`, 
          top: `${pos.y}px`, 
          width: `${size.w}px`, 
          height: `${size.h}px`,
          position: 'fixed',
          margin: 0
        }}
      >
        <div className="settings-header window-title-bar" onMouseDown={handleMouseDown}>
          <h2>{t('settings.title')}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="settings-body">
          <div className="settings-sidebar">
            <div 
              className={`settings-menu-item ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => onTabChange('general')}
            >
              {t('settings.tab_general')}
            </div>
            <div 
              className={`settings-menu-item ${activeTab === 'storage' ? 'active' : ''}`}
              onClick={() => onTabChange('storage')}
            >
              {t('settings.tab_storage')}
            </div>
            <div 
              className={`settings-menu-item ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => onTabChange('history')}
            >
              {t('settings.tab_history')}
            </div>
            <div 
              className={`settings-menu-item ${activeTab === 'everything' ? 'active' : ''}`}
              onClick={() => onTabChange('everything')}
            >
              {t('settings.tab_everything')}
            </div>
          </div>

          <div className="settings-content">
            {activeTab === 'general' && (
              <GeneralSettings 
                startupFolderType={startupFolderType}
                language={language}
                theme={theme}
                background={background}
                onUpdateStartupFolderType={onUpdateStartupFolderType}
                onUpdateLanguage={onUpdateLanguage}
                onUpdateTheme={onUpdateTheme}
                onUpdateBackground={onUpdateBackground}
                onPickBackgroundImage={onPickBackgroundImage}
              />
            )}
            {activeTab === 'storage' && (
              <StorageSettings 
                dataStoragePath={dataStoragePath}
                onChangeStoragePath={onChangeStoragePath}
              />
            )}
            {activeTab === 'history' && (
              <HistorySettings 
                historyRetentionDays={historyRetentionDays}
                onUpdateHistoryRetention={onUpdateHistoryRetention}
              />
            )}
            {activeTab === 'everything' && (
              <EverythingSettings 
                everythingEnabled={everythingEnabled}
                everythingMaxResults={everythingMaxResults}
                everythingCliPath={everythingCliPath}
                onUpdateEnabled={onUpdateEverythingEnabled}
                onUpdateMaxResults={onUpdateEverythingMaxResults}
                onUpdateCliPath={onUpdateEverythingCliPath}
              />
            )}
          </div>
        </div>

        <div className="settings-footer">
          <button className="settings-button primary" onClick={onClose}>{t('common.close')}</button>
        </div>

        {/* Window Resize Handles */}
        <div className="win-resize-handle e" onMouseDown={(e) => handleResizeStart(e, 'e')}></div>
        <div className="win-resize-handle s" onMouseDown={(e) => handleResizeStart(e, 's')}></div>
        <div className="win-resize-handle se" onMouseDown={(e) => handleResizeStart(e, 'se')}></div>
      </div>
    </div>
  );
}
