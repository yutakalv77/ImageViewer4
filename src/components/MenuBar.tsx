import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { HistoryEntry } from "../types";

interface MenuBarProps {
  history: HistoryEntry[];
  onOpenFolder: () => void;
  onOpenSettings: () => void;
  onSelectHistory: (path: string) => void;
}

export function MenuBar({ history, onOpenFolder, onOpenSettings, onSelectHistory }: MenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    const handleClick = () => setActiveMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const latestHistory = history.slice(0, 10);

  return (
    <nav className="menu-bar" onClick={(e) => e.stopPropagation()}>
      <div className="menu-item">
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
            <li onClick={() => getCurrentWindow().close()}>終了(X)</li>
          </ul>
        )}
      </div>

      <div className="menu-item">
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

      <div className="menu-item">
        <button 
          className={`menu-button ${activeMenu === "settings" ? "active" : ""}`}
          onClick={() => { onOpenSettings(); setActiveMenu(null); }}
        >
          設定(S)
        </button>
      </div>
      <div className="menu-item">
        <button className="menu-button">ヘルプ(H)</button>
      </div>
    </nav>
  );
}
