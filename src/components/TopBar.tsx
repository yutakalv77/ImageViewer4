import { getCurrentWindow } from "@tauri-apps/api/window";

interface TopBarProps {
  currentPath: string;
}

export function TopBar({ currentPath }: TopBarProps) {
  const appWindow = getCurrentWindow();

  const handleDrag = async (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (await appWindow.isMaximized()) {
      await appWindow.unmaximize();
    }
    await appWindow.startDragging();
  };

  const handleDoubleClick = () => {
    appWindow.toggleMaximize();
  };

  return (
    <header 
      className="top-bar" 
      onMouseDown={handleDrag}
      onDoubleClick={handleDoubleClick}
    >
      <div className="current-path-display">
        {currentPath || "フォルダを開くか、ここにドラッグ＆ドロップしてください"}
      </div>
    </header>
  );
}
