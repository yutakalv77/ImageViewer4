interface TopBarProps {
  currentPath: string;
}

export function TopBar({ currentPath }: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="current-path-display">
        {currentPath || "フォルダを開くか、ここにドラッグ＆ドロップしてください"}
      </div>
    </header>
  );
}
