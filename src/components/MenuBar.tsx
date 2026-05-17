import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useWindow } from "../hooks/useWindow";
import { VIRTUAL_PATH_FAVORITES } from "../utils/pathUtils";
import { useSettingsContext } from "../context/SettingsContext";
import { useFileSystemContext } from "../context/FileSystemContext";
import { useUIContext } from "../context/UIContext";
import "./MenuBar.css";

interface MenuBarProps {
  onStartSlideshow: () => void;
  onRevealCurrentPath: () => void;
}

export function MenuBar({ 
  onStartSlideshow,
  onRevealCurrentPath
}: MenuBarProps) {
  const { t } = useTranslation();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { os, toggleMaximize, minimize, close, handleDrag } = useWindow();
  
  const {
    slideInterval, slideLoop, viewMode, readingDirection, firstPageIsCover,
    thumbnailSize, updateThumbnailSize, resetThumbnailSize, thumbnailSizeDefault,
    updateSlideInterval, toggleSlideLoop, updateViewMode, updateReadingDirection,
    toggleFirstPageIsCover
  } = useSettingsContext();

  const {
    history, loadDirectory, openFolderDialog
  } = useFileSystemContext();

  const {
    setIsFavoritesOpen, setIsIntervalDialogOpen, setIsSettingsOpen
  } = useUIContext();

  useEffect(() => {
    const handleClick = () => setActiveMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const latestHistory = history.slice(0, 10);

  const renderCheck = (condition: boolean) => {
    return condition ? <span className="menu-check">✓</span> : <span className="menu-check-placeholder"></span>;
  };

  const isStandardInterval = [1, 2, 3, 4, 5, 6, 7, 8, 9].includes(slideInterval);

  const thumbnailPercentage = Math.round((thumbnailSize / thumbnailSizeDefault) * 100);

  return (
    <nav 
      className={`menu-bar ${os === 'macos' ? 'macos' : ''}`} 
      onClick={(e) => e.stopPropagation()} 
      onMouseDown={handleDrag}
      onDoubleClick={toggleMaximize}
    >
      <div className="menu-items-container">
        {/* 1. ファイル */}
        <div className="menu-item" onMouseDown={(e) => e.stopPropagation()}>
          <button 
            className={`menu-button ${activeMenu === "file" ? "active" : ""}`}
            onClick={() => setActiveMenu(activeMenu === "file" ? null : "file")}
          >
            {t('menu.file')}
          </button>
          {activeMenu === "file" && (
            <ul className="menu-dropdown">
              <li onClick={() => { openFolderDialog(); setActiveMenu(null); }}>{t('file_menu.open_folder')}</li>
              <li onClick={() => { onRevealCurrentPath(); setActiveMenu(null); }}>{t('file_menu.reveal_in_explorer')}</li>
              <li className="separator"></li>
              <li onClick={close}>{t('file_menu.exit')}</li>
            </ul>
          )}
        </div>

        {/* 2. 表示 */}
        <div className="menu-item" onMouseDown={(e) => e.stopPropagation()}>
          <button 
            className={`menu-button ${activeMenu === "view" ? "active" : ""}`}
            onClick={() => setActiveMenu(activeMenu === "view" ? null : "view")}
          >
            {t('menu.view')}
          </button>
          {activeMenu === "view" && (
            <ul className="menu-dropdown">
              <li onClick={(e) => { e.stopPropagation(); updateViewMode("single"); }}>
                {renderCheck(viewMode === "single")} {t('view_menu.single')}
              </li>
              <li onClick={(e) => { e.stopPropagation(); updateViewMode("spread"); }}>
                {renderCheck(viewMode === "spread")} {t('view_menu.spread')}
              </li>
              <li className="separator"></li>
              <li 
                onClick={(e) => { e.stopPropagation(); updateReadingDirection("rtl"); }}
              >
                {renderCheck(readingDirection === "rtl")} {t('view_menu.rtl')}
              </li>
              <li 
                onClick={(e) => { e.stopPropagation(); updateReadingDirection("ltr"); }}
              >
                {renderCheck(readingDirection === "ltr")} {t('view_menu.ltr')}
              </li>
              <li className="separator"></li>
              <li 
                className={viewMode === "single" ? "disabled" : ""}
                onClick={(e) => { if (viewMode === "spread") { e.stopPropagation(); toggleFirstPageIsCover(); } }}
              >
                {renderCheck(firstPageIsCover)} {t('view_menu.first_page_cover')}
              </li>
              <li className="separator"></li>
              <li onClick={(e) => { e.stopPropagation(); updateThumbnailSize(20); }}>
                {t('view_menu.zoom_in_thumb')}
              </li>
              <li onClick={(e) => { e.stopPropagation(); updateThumbnailSize(-20); }}>
                {t('view_menu.zoom_out_thumb')}
              </li>
              <li onClick={(e) => { e.stopPropagation(); resetThumbnailSize(); }}>
                {t('view_menu.reset_thumb')} ({thumbnailPercentage}%)
              </li>
            </ul>
          )}
        </div>

        {/* 3. スライド */}
        <div className="menu-item" onMouseDown={(e) => e.stopPropagation()}>
          <button 
            className={`menu-button ${activeMenu === "slide" ? "active" : ""}`}
            onClick={() => setActiveMenu(activeMenu === "slide" ? null : "slide")}
          >
            {t('menu.slide')}
          </button>
          {activeMenu === "slide" && (
            <ul className="menu-dropdown">
              <li onClick={() => { onStartSlideshow(); setActiveMenu(null); }}>{t('slide_menu.start')}</li>
              <li onClick={(e) => { e.stopPropagation(); toggleSlideLoop(); }}>
                {renderCheck(slideLoop)} {t('slide_menu.loop')}
              </li>
              <li className="separator"></li>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(sec => (
                <li key={sec} onClick={(e) => { e.stopPropagation(); updateSlideInterval(sec); }}>
                  {renderCheck(slideInterval === sec)} {sec.toFixed(1)}{t('slide_menu.interval_unit')}
                </li>
              ))}
              <li className="separator"></li>
              <li onClick={() => { setIsIntervalDialogOpen(true); setActiveMenu(null); }}>
                {renderCheck(!isStandardInterval)} {t('slide_menu.interval_custom')}（{slideInterval.toFixed(1)}{t('slide_menu.interval_unit')}）
              </li>
            </ul>
          )}
        </div>

        {/* 4. お気に入り */}
        <div className="menu-item" onMouseDown={(e) => e.stopPropagation()}>
          <button 
            className={`menu-button ${activeMenu === "favorites" ? "active" : ""}`}
            onClick={() => setActiveMenu(activeMenu === "favorites" ? null : "favorites")}
          >
            {t('menu.favorites')}
          </button>
          {activeMenu === "favorites" && (
            <ul className="menu-dropdown">
              <li onClick={() => { loadDirectory(VIRTUAL_PATH_FAVORITES); setActiveMenu(null); }}>
                {t('favorites.view_as_gallery')}
              </li>
              <li onClick={() => { setIsFavoritesOpen(true); setActiveMenu(null); }}>
                {t('favorites.show_list')}
              </li>
            </ul>
          )}
        </div>

        {/* 5. 履歴 */}
        <div className="menu-item" onMouseDown={(e) => e.stopPropagation()}>
          <button 
            className={`menu-button ${activeMenu === "history" ? "active" : ""}`}
            onClick={() => setActiveMenu(activeMenu === "history" ? null : "history")}
          >
            {t('menu.history')}
          </button>
          {activeMenu === "history" && (
            <ul className="menu-dropdown history-dropdown">
              {latestHistory.length > 0 ? (
                latestHistory.map((entry, idx) => (
                  <li key={idx} onClick={() => { loadDirectory(entry.path); setActiveMenu(null); }}>
                    {entry.path}
                  </li>
                ))
              ) : (
                <li className="disabled">{t('common.no_history')}</li>
              )}
            </ul>
          )}
        </div>

        {/* 6. 設定 */}
        <div className="menu-item" onMouseDown={(e) => e.stopPropagation()}>
          <button 
            className={`menu-button ${activeMenu === "settings" ? "active" : ""}`}
            onClick={() => { setIsSettingsOpen(true); setActiveMenu(null); }}
          >
            {t('menu.settings')}
          </button>
        </div>

        {/* 7. ヘルプ */}
        <div className="menu-item" onMouseDown={(e) => e.stopPropagation()}>
          <button className="menu-button">{t('menu.help')}</button>
        </div>
      </div>

      {os !== 'macos' && (
        <div className="window-controls" onMouseDown={(e) => e.stopPropagation()}>
          <div className="window-control-button minimize" onClick={minimize}>
            <svg width="10" height="1" viewBox="0 0 10 1"><path d="M0 0h10v1H0z" fill="currentColor"/></svg>
          </div>
          <div className="window-control-button maximize" onClick={toggleMaximize}>
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M0 0v10h10V0H0zm9 9H1V1h8v8z" fill="currentColor"/>
            </svg>
          </div>
          <div className="window-control-button close" onClick={close}>
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M0 0l10 10M10 0L0 10" stroke="currentColor" strokeWidth="1.2" fill="none"/>
            </svg>
          </div>
        </div>
      )}
    </nav>
  );
}
