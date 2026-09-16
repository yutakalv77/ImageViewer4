import React from 'react';
import { useAutoHide } from '../hooks/useAutoHide';
import './AppHeader.css';

export interface AppHeaderProps {
  isPinned: boolean;
  isLocked?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}

/**
 * MenuBar と TopBar を内包し、ピン留め解除時にヘッダー全体をまとめてオートハイドするコンテナコンポーネント
 */
export function AppHeader({
  isPinned,
  isLocked = false,
  onContextMenu,
  onDoubleClick,
  children
}: AppHeaderProps) {
  const { isVisible, show, scheduleHide } = useAutoHide({
    isPinned,
    isLocked,
  });

  return (
    <>
      {!isPinned && (
        <div 
          className="header-trigger-zone"
          onMouseEnter={show}
          data-testid="header-trigger-zone"
        />
      )}
      <div 
        className={`app-header ${!isPinned ? 'unpinned' : ''} ${isVisible ? 'visible' : 'hidden'}`}
        onMouseEnter={show}
        onMouseLeave={scheduleHide}
        onContextMenu={onContextMenu}
        onDoubleClick={onDoubleClick}
        data-testid="app-header"
      >
        {children}
      </div>
    </>
  );
}
