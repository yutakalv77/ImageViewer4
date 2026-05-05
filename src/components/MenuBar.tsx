import { useState, useEffect } from "react";
import { HistoryEntry } from "../types";
import { useWindow } from "../hooks/useWindow";

interface MenuBarProps {
  history: HistoryEntry[];
  onOpenFolder: () => void;
  onOpenSettings: () => void;
  onOpenFavorites: () => void;
  onSelectHistory: (path: string) => void;
}

export function MenuBar({ history, onOpenFolder, onOpenSettings, onOpenFavorites, onSelectHistory }: MenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { os, isMaximized, handleDrag, toggleMaximize, minimize, close } = useWindow();

  useEffect(() => {
    const handleClick = () => setActiveMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const latestHistory = history.slice(0, 10);

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
            {isMaximized ? (
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path d="M2.1 0v2H0v8h8V7.9h2V0H2.1zm4.9 8.9H1V3.1h6v5.8zm2-2.1h-1V2.1H3.1v-1h5.9v5.8z" fill="currentColor"/>
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path d="M0 0v10h10V0H0zm9 9H1V1h8v8z" fill="currentColor"/>
              </svg>
            )}
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
