import { useState, useEffect } from "react";
import { HistoryEntry } from "../types";
import { useWindow } from "../hooks/useWindow";

interface MenuBarProps {
  history: HistoryEntry[];
  slideInterval: number;
  slideLoop: boolean;
  viewMode: "single" | "spread";
  readingDirection: "rtl" | "ltr";
  firstPageIsCover: boolean;
  onOpenFolder: () => void;
  onOpenSettings: () => void;
  onOpenFavorites: () => void;
  onSelectHistory: (path: string) => void;
  onStartSlideshow: () => void;
  onToggleLoop: () => void;
  onUpdateInterval: (seconds: number) => void;
  onOpenIntervalDialog: () => void;
  onUpdateViewMode: (mode: "single" | "spread") => void;
  onUpdateReadingDirection: (direction: "rtl" | "ltr") => void;
  onToggleFirstPageIsCover: () => void;
  onRevealCurrentPath: () => void;
}

export function MenuBar({ 
  history, 
  slideInterval,
  slideLoop,
  viewMode,
  readingDirection,
  firstPageIsCover,
  onOpenFolder, 
  onOpenSettings, 
  onOpenFavorites, 
  onSelectHistory,
  onStartSlideshow,
  onToggleLoop,
  onUpdateInterval,
  onOpenIntervalDialog,
  onUpdateViewMode,
  onUpdateReadingDirection,
  onToggleFirstPageIsCover,
  onRevealCurrentPath
}: MenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { os, toggleMaximize, minimize, close, handleDrag } = useWindow();

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

  return (
    <nav 
      className={`menu-bar ${os === 'macos' ? 'macos' : ''}`} 
      onClick={(e) => e.stopPropagation()} 
      onMouseDown={handleDrag}
      onDoubleClick={toggleMaximize}
    >
      <div className="menu-items-container">
        <div className="menu-item" onMouseDown={(e) => e.stopPropagation()}>
          <button 
            className={`menu-button ${activeMenu === "file" ? "active" : ""}`}
            onClick={() => setActiveMenu(activeMenu === "file" ? null : "file")}
          >
            ファイル(F)
          </button>
          {activeMenu === "file" && (
            <ul className="menu-dropdown">
              <li onClick={() => { onOpenFolder(); setActiveMenu(null); }}>フォルダを開く(O)...</li>
              <li onClick={() => { onRevealCurrentPath(); setActiveMenu(null); }}>エクスプローラーで表示</li>
              <li className="separator"></li>
              <li onClick={close}>終了(X)</li>
            </ul>
          )}
        </div>

        <div className="menu-item" onMouseDown={(e) => e.stopPropagation()}>
          <button 
            className={`menu-button ${activeMenu === "history" ? "active" : ""}`}
            onClick={() => setActiveMenu(activeMenu === "history" ? null : "history")}
          >
            履歴(R)
          </button>
          {activeMenu === "history" && (
            <ul className="menu-dropdown history-dropdown">
              {latestHistory.length > 0 ? (
                latestHistory.map((entry, idx) => (
                  <li key={idx} onClick={() => { onSelectHistory(entry.path); setActiveMenu(null); }}>
                    {entry.path}
                  </li>
                ))
              ) : (
                <li className="disabled">履歴はありません</li>
              )}
            </ul>
          )}
        </div>

        <div className="menu-item" onMouseDown={(e) => e.stopPropagation()}>
          <button 
            className={`menu-button ${activeMenu === "favorites" ? "active" : ""}`}
            onClick={() => { onOpenFavorites(); setActiveMenu(null); }}
          >
            お気に入り(B)
          </button>
        </div>

        <div className="menu-item" onMouseDown={(e) => e.stopPropagation()}>
          <button 
            className={`menu-button ${activeMenu === "view" ? "active" : ""}`}
            onClick={() => setActiveMenu(activeMenu === "view" ? null : "view")}
          >
            表示(V)
          </button>
          {activeMenu === "view" && (
            <ul className="menu-dropdown">
              <li onClick={(e) => { e.stopPropagation(); onUpdateViewMode("single"); }}>
                {renderCheck(viewMode === "single")} 単一表示
              </li>
              <li onClick={(e) => { e.stopPropagation(); onUpdateViewMode("spread"); }}>
                {renderCheck(viewMode === "spread")} 見開き表示
              </li>
              <li className="separator"></li>
              <li 
                className={viewMode === "single" ? "disabled" : ""}
                onClick={(e) => { if (viewMode === "spread") { e.stopPropagation(); onUpdateReadingDirection("rtl"); } }}
              >
                {renderCheck(readingDirection === "rtl")} 右から左（日本語）
              </li>
              <li 
                className={viewMode === "single" ? "disabled" : ""}
                onClick={(e) => { if (viewMode === "spread") { e.stopPropagation(); onUpdateReadingDirection("ltr"); } }}
              >
                {renderCheck(readingDirection === "ltr")} 左から右（洋書）
              </li>
              <li className="separator"></li>
              <li 
                className={viewMode === "single" ? "disabled" : ""}
                onClick={(e) => { if (viewMode === "spread") { e.stopPropagation(); onToggleFirstPageIsCover(); } }}
              >
                {renderCheck(firstPageIsCover)} 最初の1枚を表紙にする
              </li>
            </ul>
          )}
        </div>

        <div className="menu-item" onMouseDown={(e) => e.stopPropagation()}>
          <button 
            className={`menu-button ${activeMenu === "slide" ? "active" : ""}`}
            onClick={() => setActiveMenu(activeMenu === "slide" ? null : "slide")}
          >
            スライド(S)
          </button>
          {activeMenu === "slide" && (
            <ul className="menu-dropdown">
              <li onClick={() => { onStartSlideshow(); setActiveMenu(null); }}>スライドショー開始</li>
              <li onClick={(e) => { e.stopPropagation(); onToggleLoop(); }}>
                {renderCheck(slideLoop)} 繰り返し
              </li>
              <li className="separator"></li>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(sec => (
                <li key={sec} onClick={(e) => { e.stopPropagation(); onUpdateInterval(sec); }}>
                  {renderCheck(slideInterval === sec)} {sec.toFixed(1)}秒
                </li>
              ))}
              <li className="separator"></li>
              <li onClick={() => { onOpenIntervalDialog(); setActiveMenu(null); }}>
                {renderCheck(!isStandardInterval)} 時間指定（{slideInterval.toFixed(1)}秒）
              </li>
            </ul>
          )}
        </div>

        <div className="menu-item" onMouseDown={(e) => e.stopPropagation()}>
          <button 
            className={`menu-button ${activeMenu === "settings" ? "active" : ""}`}
            onClick={() => { onOpenSettings(); setActiveMenu(null); }}
          >
            設定(S)
          </button>
        </div>
        <div className="menu-item" onMouseDown={(e) => e.stopPropagation()}>
          <button className="menu-button">ヘルプ(H)</button>
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
