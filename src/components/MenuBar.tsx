import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useWindow } from "../hooks/useWindow";
import { VIRTUAL_PATH_FAVORITES } from "../utils/pathUtils";
import { useSettingsContext } from "../context/SettingsContext";
import { useFileSystemContext } from "../context/FileSystemContext";
import { useUIContext } from "../context/UIContext";
import { WindowControls } from "./WindowControls";
import { useDismiss } from "../hooks/useDismiss";
import "./MenuBar.css";

interface MenuBarProps {
  onStartSlideshow: () => void;
  onRevealCurrentPath: () => void;
  onLoadDirectory?: (path: string) => void;
  onOpenFolderDialog?: () => void;
}

export function MenuBar({ 
  onStartSlideshow,
  onRevealCurrentPath,
  onLoadDirectory,
  onOpenFolderDialog
}: MenuBarProps) {
  const { t } = useTranslation();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isSortSubmenuOpen, setIsSortSubmenuOpen] = useState(false);
  const { os, toggleMaximize, minimize, close, handleDrag } = useWindow();
  
  const {
    slideInterval, slideLoop, viewMode, readingDirection, firstPageIsCover,
    thumbnailSize, updateThumbnailSize, resetThumbnailSize, thumbnailSizeDefault,
    updateSlideInterval, toggleSlideLoop, updateViewMode, updateReadingDirection,
    toggleFirstPageIsCover, sortBy, sortOrder, updateSortBy, updateSortOrder
  } = useSettingsContext();

  const {
    history, loadDirectory: fsLoadDirectory, openFolderDialog: fsOpenFolderDialog
  } = useFileSystemContext();

  const loadFolder = onLoadDirectory || fsLoadDirectory;
  const openFolder = onOpenFolderDialog || fsOpenFolderDialog;

  const {
    setIsFavoritesOpen, setIsIntervalDialogOpen, setIsSettingsOpen
  } = useUIContext();

  // ドロップダウンメニュー外のクリック、Escapeキー、ウィンドウぼかしでメニューを閉じる
  useDismiss(activeMenu !== null, () => setActiveMenu(null), {
    ignoreSelectors: [".menu-dropdown", ".menu-button"],
  });

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
              <li onClick={() => { openFolder(); setActiveMenu(null); }}>{t('file_menu.open_folder')}</li>
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
              <li onClick={() => { loadFolder(VIRTUAL_PATH_FAVORITES); setActiveMenu(null); }}>
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
                  <li key={idx} onClick={() => { loadFolder(entry.path); setActiveMenu(null); }}>
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
        <WindowControls 
          onMinimize={minimize}
          onToggleMaximize={toggleMaximize}
          onClose={close}
        />
      )}
    </nav>
  );
}
