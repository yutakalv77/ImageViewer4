import { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { isSearchPath, getBreadcrumbs, isVirtualPath } from "../utils/pathUtils";
import { isTargetInputOrTextarea } from "../utils/windowMenuUtils";
import { SearchScope } from "../types";
import {
  determineSearchScope,
  getSearchPlaceholder,
  getSearchScopeTooltip,
  toggleSearchScope as toggleScopeUtil,
} from "../utils/searchUtils";
import "./TopBar.css";

function FolderIcon({ className, size = 14 }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      data-testid="search-folder-icon"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function GlobeIcon({ className, size = 14 }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      data-testid="search-globe-icon"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export interface TopBarProps {
  currentPath: string;
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
  onGoUp: () => void;
  onLoadDirectory: (path: string) => void;
  onSearch: (query: string, scope?: SearchScope) => void;
  onDrag: (e: React.MouseEvent) => void;
  onMaximize: () => void;
  everythingEnabled?: boolean;
  searchScope?: SearchScope;
  onToggleSearchScope?: () => void;
}

export function TopBar({ 
  currentPath,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  onGoUp,
  onLoadDirectory,
  onSearch,
  onDrag,
  onMaximize,
  everythingEnabled = false,
  searchScope: externalScope,
  onToggleSearchScope: externalToggleScope,
}: TopBarProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [internalScope, setInternalScope] = useState<SearchScope>("folder");

  const currentScope = externalScope ?? internalScope;
  const toggleScope = useCallback(() => {
    if (externalToggleScope) {
      externalToggleScope();
    } else {
      setInternalScope((prev) => toggleScopeUtil(prev));
    }
  }, [externalToggleScope]);

  const breadcrumbs = useMemo(() => getBreadcrumbs(currentPath, t), [currentPath, t]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      const targetScope = determineSearchScope({
        isShiftKey: e.shiftKey,
        activeScope: currentScope,
      });
      onSearch(searchQuery.trim(), targetScope);
      setSearchQuery("");
    }
  };

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!isTargetInputOrTextarea(e.target)) {
      e.preventDefault();
    }
    e.stopPropagation();
  }, []);

  const isInSearch = isSearchPath(currentPath);

  return (
    <header 
      className="top-bar" 
      onMouseDown={onDrag}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onMaximize();
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={handleContextMenu}
    >
      <div 
        className="nav-buttons-group"
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <button 
          className="nav-button back-button" 
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onGoBack(); }}
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
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onGoForward(); }}
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
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onGoUp(); }}
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
          <div 
            className="breadcrumbs-list"
            onDoubleClick={(e) => e.stopPropagation()}
          >
            {isInSearch && (
              <button 
                className="exit-search-btn" 
                onClick={onGoBack}
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
                  onClick={() => onLoadDirectory(crumb.path)}
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

      <div 
        className={`search-container ${everythingEnabled ? "has-scope-btn" : ""}`} 
        onMouseDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        {everythingEnabled ? (
          <button
            type="button"
            className={`search-scope-btn is-${currentScope}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleScope();
            }}
            title={getSearchScopeTooltip(currentScope, t)}
            data-testid="search-scope-btn"
          >
            {currentScope === "folder" ? (
              <FolderIcon />
            ) : (
              <GlobeIcon />
            )}
          </button>
        ) : (
          <FolderIcon className="search-icon" />
        )}
        <input 
          type="text" 
          className="search-input" 
          placeholder={getSearchPlaceholder(currentScope, everythingEnabled, t)}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
      </div>
    </header>
  );
}
