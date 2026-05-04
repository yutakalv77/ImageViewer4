import { useWindow } from "../hooks/useWindow";

interface TopBarProps {
  currentPath: string;
}

export function TopBar({ currentPath }: TopBarProps) {
  const { handleDrag, toggleMaximize } = useWindow();

  return (
    <header 
      className="top-bar" 
      onMouseDown={handleDrag}
      onDoubleClick={toggleMaximize}
    >
      <div className="current-path-display">
        {currentPath || "フォルダを開くか、ここにドラッグ＆ドロップしてください"}
      </div>
    </header>
  );
}
