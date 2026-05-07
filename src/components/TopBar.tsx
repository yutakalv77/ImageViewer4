import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useWindow } from "../hooks/useWindow";
import { isVirtualPath, getVirtualPathLabel, isSearchPath } from "../utils/virtualPathUtils";

interface TopBarProps {
  currentPath: string;
  canGoBack: boolean;
  canGoForward: boolean;
  onNavigate: (path: string) => void;
  onGoUp: () => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onSearch: (query: string) => void;
  onExitSearch: () => void;
}

export function TopBar({ 
  currentPath, 
  canGoBack, 
  canGoForward, 
  onNavigate, 
  onGoUp, 
  onGoBack, 
  onGoForward,
  onSearch,
  onExitSearch
}: TopBarProps) {
  const { handleDrag, toggleMaximize } = useWindow();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const breadcrumbs = useMemo(() => {
    if (!currentPath) return [];
    
    if (isVirtualPath(currentPath)) {
      return [{ name: getVirtualPathLabel(currentPath, t), path: currentPath }];
    }

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
  }, [currentPath, t]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setSearchQuery("");
    }
  };

  const isInSearch = isSearchPath(currentPath);

  return (
    <header 
      className="top-bar" 
      onMouseDown={handleDrag}
      onDoubleClick={toggleMaximize}
    >
      <div className="nav-buttons-group">
        <button 
          className="nav-button back-button" 
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onGoBack(); }}
          title={t('common.nav_back')}
          disabled={!canGoBack}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <button 
          className="nav-button forward-button" 
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onGoForward(); }}
          title={t('common.nav_forward')}
          disabled={!canGoForward}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
        <button 
          className="nav-button up-button" 
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onGoUp(); }}
          title={t('common.nav_up')}
          disabled={!currentPath || isVirtualPath(currentPath)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
        </button>
      </div>
      
      <div className="breadcrumbs" onMouseDown={(e) => e.stopPropagation()}>
        {!currentPath ? (
          <div className="current-path-display">{t('common.drag_hint')}</div>
        ) : (
          <div className="breadcrumbs-list">
            {isInSearch && (
              <button 
                className="exit-search-btn" 
                onClick={onExitSearch}
                title={t('common.nav_exit_search')}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                <span>{t('common.back')}</span>
              </button>
            )}
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

      <div className="search-container" onMouseDown={(e) => e.stopPropagation()}>
        <input 
          type="text" 
          className="search-input" 
          placeholder={t('common.search_placeholder') || "検索..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
        <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
      </div>
    </header>
  );
}
