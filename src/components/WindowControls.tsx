interface WindowControlsProps {
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
}

export function WindowControls({
  onMinimize,
  onToggleMaximize,
  onClose
}: WindowControlsProps) {
  return (
    <div 
      className="window-controls" 
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <div 
        className="window-control-button minimize" 
        onClick={onMinimize}
        role="button"
        aria-label="Minimize window"
      >
        <svg width="10" height="1" viewBox="0 0 10 1">
          <path d="M0 0h10v1H0z" fill="currentColor"/>
        </svg>
      </div>
      <div 
        className="window-control-button maximize" 
        onClick={onToggleMaximize}
        role="button"
        aria-label="Maximize window"
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M0 0v10h10V0H0zm9 9H1V1h8v8z" fill="currentColor"/>
        </svg>
      </div>
      <div 
        className="window-control-button close" 
        onClick={onClose}
        role="button"
        aria-label="Close window"
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M0 0l10 10M10 0L0 10" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        </svg>
      </div>
    </div>
  );
}
