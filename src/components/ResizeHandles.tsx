import { getCurrentWindow } from "@tauri-apps/api/window";

export function ResizeHandles() {
  const appWindow = getCurrentWindow();

  const handleResize = (direction: string) => (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    e.preventDefault();
    e.stopPropagation();
    // In Tauri v2, the method is startResizeDragging
    // @ts-ignore - The types might not be updated in the environment yet
    appWindow.startResizeDragging(direction);
  };

  return (
    <div className="resize-handles">
      <div className="resize-handle n" onMouseDown={handleResize("North")}></div>
      <div className="resize-handle s" onMouseDown={handleResize("South")}></div>
      <div className="resize-handle e" onMouseDown={handleResize("East")}></div>
      <div className="resize-handle w" onMouseDown={handleResize("West")}></div>
      <div className="resize-handle nw" onMouseDown={handleResize("NorthWest")}></div>
      <div className="resize-handle ne" onMouseDown={handleResize("NorthEast")}></div>
      <div className="resize-handle sw" onMouseDown={handleResize("SouthWest")}></div>
      <div className="resize-handle se" onMouseDown={handleResize("SouthEast")}></div>
    </div>
  );
}
