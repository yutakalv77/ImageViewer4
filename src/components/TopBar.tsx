import { useMemo } from "react";
import { useWindow } from "../hooks/useWindow";

interface TopBarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onGoUp: () => void;
}

export function TopBar({ currentPath, onNavigate, onGoUp }: TopBarProps) {
  const { handleDrag, toggleMaximize } = useWindow();

  const breadcrumbs = useMemo(() => {
    if (!currentPath) return [];
    
    const separator = currentPath.includes("\\") ? "\\" : "/";
    const isWindows = currentPath.includes("\\") || /^[A-Z]:/i.test(currentPath);
    
    const parts = currentPath.split(separator).filter(p => p !== "");
    const crumbs = [];
    
    if (isWindows) {
      let accumulatedPath = "";
      for (let i = 0; i < parts.length; i++) {
        accumulatedPath += (i === 0 ? "" : separator) + parts[i];
        crumbs.push({
          name: parts[i],
          path: accumulatedPath + (i === 0 ? separator : "")
        });
      }
    } else {
      // macOS / Linux
      let accumulatedPath = "";
      crumbs.push({ name: "/", path: "/" });
      for (let i = 0; i < parts.length; i++) {
        accumulatedPath += (accumulatedPath === "/" ? "" : "/") + parts[i];
        crumbs.push({
          name: parts[i],
          path: accumulatedPath
        });
      }
    }
    return crumbs;
  }, [currentPath]);

  return (
    <header 
      className="top-bar" 
      onMouseDown={handleDrag}
      onDoubleClick={toggleMaximize}
    >
      <button 
        className="nav-button up-button" 
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onGoUp(); }}
        title="1つ上の階層へ"
        disabled={!currentPath}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7"/>
        </svg>
      </button>
      
      <div className="breadcrumbs" onMouseDown={(e) => e.stopPropagation()}>
        {!currentPath ? (
          <div className="current-path-display">フォルダを開くか、ここにドラッグ＆ドロップしてください</div>
        ) : (
          <div className="breadcrumbs-list">
            {breadcrumbs.map((crumb, idx) => (
              <span key={`${crumb.path}-${idx}`} className="breadcrumb-item">
                <span 
                  className="breadcrumb-name" 
                  onClick={() => onNavigate(crumb.path)}
                  title={crumb.path}
                >
                  {crumb.name}
                </span>
                {idx < breadcrumbs.length - 1 && <span className="breadcrumb-separator">/</span>}
              </span>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
