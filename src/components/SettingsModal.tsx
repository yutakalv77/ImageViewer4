import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StorageSettings } from "./settings/StorageSettings";
import { HistorySettings } from "./settings/HistorySettings";
import { GeneralSettings } from "./settings/GeneralSettings";
import { EverythingSettings } from "./settings/EverythingSettings";
import { useSettingsContext } from "../context/SettingsContext";
import { useUIContext } from "../context/UIContext";
import "./SettingsModal.css";

export function SettingsModal() {
  const { t } = useTranslation();
  
  const {
    dataStoragePath, changeStoragePath, historyRetentionDays, updateHistoryRetention,
    startupFolderType, updateStartupFolderType, slideInterval, updateSlideInterval,
    slideLoop, toggleSlideLoop, viewMode, updateViewMode, readingDirection,
    updateReadingDirection, firstPageIsCover, toggleFirstPageIsCover,
    language, updateLanguage, theme, updateTheme, 
    background, updateBackground, pickBackgroundImage,
    everythingEnabled, updateEverythingEnabled, everythingMaxResults, updateEverythingMaxResults,
    everythingCliPath, updateEverythingCliPath
  } = useSettingsContext();

  const {
    isSettingsOpen, setIsSettingsOpen, activeSettingsTab, setActiveSettingsTab
  } = useUIContext();

  const onClose = () => setIsSettingsOpen(false);
  const onTabChange = (tab: string) => setActiveSettingsTab(tab);

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
    if (isSettingsOpen && !isInitialized) {
      const x = (window.innerWidth - size.w) / 2;
      const y = (window.innerHeight - size.h) / 2;
      setPos({ x, y });
      setIsInitialized(true);
    }
    if (!isSettingsOpen) {
      setIsInitialized(false);
    }
  }, [isSettingsOpen, isInitialized, size.w, size.h]);

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
    if (isSettingsOpen) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isSettingsOpen, handleMouseMove, handleMouseUp]);

  if (!isSettingsOpen) return null;

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
              className={`settings-menu-item ${activeSettingsTab === 'general' ? 'active' : ''}`}
              onClick={() => onTabChange('general')}
            >
              {t('settings.tab_general')}
            </div>
            <div 
              className={`settings-menu-item ${activeSettingsTab === 'storage' ? 'active' : ''}`}
              onClick={() => onTabChange('storage')}
            >
              {t('settings.tab_storage')}
            </div>
            <div 
              className={`settings-menu-item ${activeSettingsTab === 'history' ? 'active' : ''}`}
              onClick={() => onTabChange('history')}
            >
              {t('settings.tab_history')}
            </div>
            <div 
              className={`settings-menu-item ${activeSettingsTab === 'everything' ? 'active' : ''}`}
              onClick={() => onTabChange('everything')}
            >
              {t('settings.tab_everything')}
            </div>
          </div>

          <div className="settings-content">
            {activeSettingsTab === 'general' && (
              <GeneralSettings 
                startupFolderType={startupFolderType}
                language={language}
                theme={theme}
                background={background}
                onUpdateStartupFolderType={updateStartupFolderType}
                onUpdateLanguage={updateLanguage}
                onUpdateTheme={updateTheme}
                onUpdateBackground={updateBackground}
                onPickBackgroundImage={pickBackgroundImage}
              />
            )}
            {activeSettingsTab === 'storage' && (
              <StorageSettings 
                dataStoragePath={dataStoragePath}
                onChangeStoragePath={changeStoragePath}
              />
            )}
            {activeSettingsTab === 'history' && (
              <HistorySettings 
                historyRetentionDays={historyRetentionDays}
                onUpdateHistoryRetention={updateHistoryRetention}
              />
            )}
            {activeSettingsTab === 'everything' && (
              <EverythingSettings 
                everythingEnabled={everythingEnabled}
                everythingMaxResults={everythingMaxResults}
                everythingCliPath={everythingCliPath}
                onUpdateEnabled={updateEverythingEnabled}
                onUpdateMaxResults={updateEverythingMaxResults}
                onUpdateCliPath={updateEverythingCliPath}
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
