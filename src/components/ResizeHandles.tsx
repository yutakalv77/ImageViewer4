import { useWindow } from "../hooks/useWindow";
import { useResizeHandles } from "../hooks/useResizeHandles";
import "./ResizeHandles.css";

export function ResizeHandles() {
  const { startResizing, toggleVerticalMaximize } = useWindow();
  const { handleMouseDown, handleDoubleClick } = useResizeHandles({
    onStartResizing: startResizing,
    onVerticalDoubleClick: toggleVerticalMaximize,
  });

  return (
    <div className="resize-handles">
      <div
        className="resize-handle n"
        data-direction="North"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        data-testid="resize-handle-n"
      />
      <div
        className="resize-handle s"
        data-direction="South"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        data-testid="resize-handle-s"
      />
      <div
        className="resize-handle e"
        data-direction="East"
        onMouseDown={handleMouseDown}
        data-testid="resize-handle-e"
      />
      <div
        className="resize-handle w"
        data-direction="West"
        onMouseDown={handleMouseDown}
        data-testid="resize-handle-w"
      />
      <div
        className="resize-handle nw"
        data-direction="NorthWest"
        onMouseDown={handleMouseDown}
        data-testid="resize-handle-nw"
      />
      <div
        className="resize-handle ne"
        data-direction="NorthEast"
        onMouseDown={handleMouseDown}
        data-testid="resize-handle-ne"
      />
      <div
        className="resize-handle sw"
        data-direction="SouthWest"
        onMouseDown={handleMouseDown}
        data-testid="resize-handle-sw"
      />
      <div
        className="resize-handle se"
        data-direction="SouthEast"
        onMouseDown={handleMouseDown}
        data-testid="resize-handle-se"
      />
    </div>
  );
}
