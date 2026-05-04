import { useWindow } from "../hooks/useWindow";

export function ResizeHandles() {
  const { startResizing } = useWindow();

  return (
    <div className="resize-handles">
      <div className="resize-handle n" onMouseDown={() => startResizing("North")}></div>
      <div className="resize-handle s" onMouseDown={() => startResizing("South")}></div>
      <div className="resize-handle e" onMouseDown={() => startResizing("East")}></div>
      <div className="resize-handle w" onMouseDown={() => startResizing("West")}></div>
      <div className="resize-handle nw" onMouseDown={() => startResizing("NorthWest")}></div>
      <div className="resize-handle ne" onMouseDown={() => startResizing("NorthEast")}></div>
      <div className="resize-handle sw" onMouseDown={() => startResizing("SouthWest")}></div>
      <div className="resize-handle se" onMouseDown={() => startResizing("SouthEast")}></div>
    </div>
  );
}
