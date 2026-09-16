import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useWindow } from "../hooks/useWindow";
import { VIRTUAL_PATH_FAVORITES } from "../utils/pathUtils";
import { useSettingsContext } from "../context/SettingsContext";
import { useFileSystemContext } from "../context/FileSystemContext";
import { useUIContext } from "../context/UIContext";
import { WindowControls } from "./WindowControls";
import { useMenuState } from "../hooks/useMenuState";
import "./MenuBar.css";

interface MenuBarProps {
  onStartSlideshow: () => void;
  onRevealCurrentPath: () => void;
  onLoadDirectory?: (path: string) => void;
  onOpenFolderDialog?: () => void;
  onMenuOpenChange?: (isOpen: boolean) => void;
}

export function MenuBar({ 
  onStartSlideshow,
  onRevealCurrentPath,
  onLoadDirectory,
  onOpenFolderDialog,
  onMenuOpenChange
}: MenuBarProps) {
  const { t } = useTranslation();
  const {
    activeMenu,
    closeMenu,
    handleMenuClick,
    handleMenuHover,
    handleMenuButtonLeave,
  } = useMenuState();
  const [isSortSubmenuOpen, setIsSortSubmenuOpen] = useState(false);
  const { os, toggleMaximize, minimize, close, handleDrag } = useWindow();
  
  const {
    slideInterval, slideLoop, viewMode, readingDirection, firstPageIsCover,
    thumbnailSize, updateThumbnailSize, resetThumbnailSize, thumbnailSizeDefault,
    updateSlideInterval, toggleSlideLoop, updateViewMode, updateReadingDirection,
    toggleFirstPageIsCover, sortBy, sortOrder, updateSortBy, updateSortOrder,
    isMenuBarPinned = true, toggleMenuBarPinned
  } = useSettingsContext();

  const {
    history, loadDirectory: fsLoadDirectory, openFolderDialog: fsOpenFolderDialog
  } = useFileSystemContext();

  const loadFolder = onLoadDirectory || fsLoadDirectory;
  const openFolder = onOpenFolderDialog || fsOpenFolderDialog;

  const {
    setIsFavoritesOpen, setIsIntervalDialogOpen, setIsSettingsOpen
  } = useUIContext();

  useEffect(() => {
    onMenuOpenChange?.(activeMenu !== null);
    return () => {
      onMenuOpenChange?.(false);
    };
  }, [activeMenu, onMenuOpenChange]);

  useEffect(() => {
    if (activeMenu !== "view") {
      setIsSortSubmenuOpen(false);
    }
  }, [activeMenu]);

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
      onDoubleClick={(e) => {
        e.stopPropagation();
        toggleMaximize();
      }}
    >
      <div 
        className="menu-items-container"
        onDoubleClick={(e) => e.stopPropagation()}
      >
        {/* 1. ファイル */}
        <div className="menu-item" onMouseDown={(e) => e.stopPropagation()}>
          <button 
            className={`menu-button ${activeMenu === "file" ? "active" : ""}`}
            onClick={() => handleMenuClick("file")}
            onMouseEnter={() => handleMenuHover("file")}
            onMouseLeave={() => handleMenuButtonLeave("file")}
          >
            {t('menu.file')}
          </button>
          {activeMenu === "file" && (
            <ul className="menu-dropdown">
              <li onClick={() => { openFolder(); closeMenu(); }}>{t('file_menu.open_folder')}</li>
              <li onClick={() => { onRevealCurrentPath(); closeMenu(); }}>{t('file_menu.reveal_in_explorer')}</li>
              <li className="separator"></li>
              <li onClick={close}>{t('file_menu.exit')}</li>
            </ul>
          )}
        </div>

        {/* 2. 表示 */}
        <div className="menu-item" onMouseDown={(e) => e.stopPropagation()}>
          <button 
            className={`menu-button ${activeMenu === "view" ? "active" : ""}`}
            onClick={() => handleMenuClick("view")}
            onMouseEnter={() => handleMenuHover("view")}
            onMouseLeave={() => handleMenuButtonLeave("view")}
          >
            {t('menu.view')}
          </button>
          {activeMenu === "view" && (
            <ul className="menu-dropdown">
              <li 
                className={`has-submenu ${isSortSubmenuOpen ? "open" : ""}`}
                onMouseEnter={() => setIsSortSubmenuOpen(true)}
                onMouseLeave={() => setIsSortSubmenuOpen(false)}
                onClick={(e) => { e.stopPropagation(); setIsSortSubmenuOpen(true); }}
              >
                <span className="submenu-label">
                  <span className="menu-check-placeholder"></span>
                  {t('view_menu.sort_by')}
                </span>
                <span className="submenu-arrow">▶</span>
                <ul className="menu-dropdown submenu" onClick={(e) => e.stopPropagation()}>
                  <li onClick={(e) => { e.stopPropagation(); updateSortBy("name"); }}>
                    {renderCheck(sortBy === "name")} {t('view_menu.sort_name')}
                  </li>
                  <li onClick={(e) => { e.stopPropagation(); updateSortBy("created"); }}>
                    {renderCheck(sortBy === "created")} {t('view_menu.sort_created')}
                  </li>
                  <li onClick={(e) => { e.stopPropagation(); updateSortBy("modified"); }}>
                    {renderCheck(sortBy === "modified")} {t('view_menu.sort_modified')}
                  </li>
                  <li onClick={(e) => { e.stopPropagation(); updateSortBy("size"); }}>
                    {renderCheck(sortBy === "size")} {t('view_menu.sort_size')}
                  </li>
                  <li onClick={(e) => { e.stopPropagation(); updateSortBy("type"); }}>
                    {renderCheck(sortBy === "type")} {t('view_menu.sort_type')}
                  </li>
                  <li className="separator"></li>
                  <li onClick={(e) => { e.stopPropagation(); updateSortOrder("asc"); }}>
                    {renderCheck(sortOrder === "asc")} {t('view_menu.sort_asc')}
                  </li>
                  <li onClick={(e) => { e.stopPropagation(); updateSortOrder("desc"); }}>
                    {renderCheck(sortOrder === "desc")} {t('view_menu.sort_desc')}
                  </li>
                </ul>
              </li>
              <li className="separator"></li>
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
              <li className="separator"></li>
              <li onClick={(e) => { e.stopPropagation(); toggleMenuBarPinned(); }}>
                {renderCheck(isMenuBarPinned)} {t('view_menu.pin_menubar')}
              </li>
            </ul>
          )}
        </div>

        {/* 3. スライド */}
        <div className="menu-item" onMouseDown={(e) => e.stopPropagation()}>
          <button 
            className={`menu-button ${activeMenu === "slide" ? "active" : ""}`}
            onClick={() => handleMenuClick("slide")}
            onMouseEnter={() => handleMenuHover("slide")}
            onMouseLeave={() => handleMenuButtonLeave("slide")}
          >
            {t('menu.slide')}
          </button>
          {activeMenu === "slide" && (
            <ul className="menu-dropdown">
              <li onClick={() => { onStartSlideshow(); closeMenu(); }}>{t('slide_menu.start')}</li>
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
              <li onClick={() => { setIsIntervalDialogOpen(true); closeMenu(); }}>
                {renderCheck(!isStandardInterval)} {t('slide_menu.interval_custom')}（{slideInterval.toFixed(1)}{t('slide_menu.interval_unit')}）
              </li>
            </ul>
          )}
        </div>

        {/* 4. お気に入り */}
        <div className="menu-item" onMouseDown={(e) => e.stopPropagation()}>
          <button 
            className={`menu-button ${activeMenu === "favorites" ? "active" : ""}`}
            onClick={() => handleMenuClick("favorites")}
            onMouseEnter={() => handleMenuHover("favorites")}
            onMouseLeave={() => handleMenuButtonLeave("favorites")}
          >
            {t('menu.favorites')}
          </button>
          {activeMenu === "favorites" && (
            <ul className="menu-dropdown">
              <li onClick={() => { loadFolder(VIRTUAL_PATH_FAVORITES); closeMenu(); }}>
                {t('favorites.view_as_gallery')}
              </li>
              <li onClick={() => { setIsFavoritesOpen(true); closeMenu(); }}>
                {t('favorites.show_list')}
              </li>
            </ul>
          )}
        </div>

        {/* 5. 履歴 */}
        <div className="menu-item" onMouseDown={(e) => e.stopPropagation()}>
          <button 
            className={`menu-button ${activeMenu === "history" ? "active" : ""}`}
            onClick={() => handleMenuClick("history")}
            onMouseEnter={() => handleMenuHover("history")}
            onMouseLeave={() => handleMenuButtonLeave("history")}
          >
            {t('menu.history')}
          </button>
          {activeMenu === "history" && (
            <ul className="menu-dropdown history-dropdown">
              {latestHistory.length > 0 ? (
                latestHistory.map((entry, idx) => (
                  <li key={idx} onClick={() => { loadFolder(entry.path); closeMenu(); }}>
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
            onClick={() => { setIsSettingsOpen(true); closeMenu(); }}
            onMouseEnter={() => handleMenuHover("settings")}
            onMouseLeave={() => handleMenuButtonLeave("settings")}
          >
            {t('menu.settings')}
          </button>
        </div>

        {/* 7. ヘルプ */}
        <div className="menu-item" onMouseDown={(e) => e.stopPropagation()}>
          <button 
            className={`menu-button ${activeMenu === "help" ? "active" : ""}`}
            onClick={() => handleMenuClick("help")}
            onMouseEnter={() => handleMenuHover("help")}
            onMouseLeave={() => handleMenuButtonLeave("help")}
          >
            {t('menu.help')}
          </button>
        </div>
      </div>

      <div 
        className="menu-bar-right" 
        onMouseDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <button
          className={`pin-button ${isMenuBarPinned ? "pinned" : "unpinned"}`}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            toggleMenuBarPinned();
          }}
          title={isMenuBarPinned ? t('menu.unpin_menubar') : t('menu.pin_menubar')}
          aria-label={isMenuBarPinned ? t('menu.unpin_menubar') : t('menu.pin_menubar')}
        >
          <svg 
            className="pin-icon" 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="12" y1="17" x2="12" y2="22"></line>
            <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
          </svg>
        </button>

        {os !== 'macos' && (
          <WindowControls 
            onMinimize={minimize}
            onToggleMaximize={toggleMaximize}
            onClose={close}
          />
        )}
      </div>
    </nav>
  );
}
