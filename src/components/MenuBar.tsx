import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

interface MenuBarProps {
  onOpenFolder: () => void;
  onOpenSettings: () => void;
}

export function MenuBar({ onOpenFolder, onOpenSettings }: MenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    const handleClick = () => setActiveMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

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
