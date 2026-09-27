import type { ReactNode } from "react";
import { useDraggableModal } from "../hooks/useDraggableModal";
import "./SettingsModal.css";

export interface ModalWindowProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialSize?: { w: number; h: number };
  minSize?: { w: number; h: number };
  className?: string;
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * ドラッグ移動・リサイズ・中央初期配置・閉じるボタンを備えた共通モーダルウィンドウコンポーネント
 */
export function ModalWindow({
  isOpen,
  onClose,
  title,
  initialSize = { w: 700, h: 500 },
  minSize = { w: 400, h: 300 },
  className = "",
  footer,
  children,
}: ModalWindowProps) {
  const { pos, size, handleMouseDown, handleResizeStart } = useDraggableModal({
    isOpen,
    initialSize,
    minSize,
  });

  if (!isOpen) return null;

  return (
    <div className="settings-window-overlay">
      <div
        className={`settings-modal draggable-window ${className}`.trim()}
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: `${size.w}px`,
          height: `${size.h}px`,
          position: "fixed",
          margin: 0,
        }}
      >
        <div className="settings-header window-title-bar" onMouseDown={handleMouseDown}>
          <h2>{title}</h2>
          <button
            className="close-button"
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label="Close"
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M0 0l10 10M10 0L0 10" stroke="currentColor" strokeWidth="1.2" fill="none" />
            </svg>
          </button>
        </div>

        {children}

        {footer && <div className="settings-footer">{footer}</div>}

        {/* Window Resize Handles */}
        <div className="win-resize-handle e" onMouseDown={(e) => handleResizeStart(e, "e")}></div>
        <div className="win-resize-handle s" onMouseDown={(e) => handleResizeStart(e, "s")}></div>
        <div className="win-resize-handle se" onMouseDown={(e) => handleResizeStart(e, "se")}></div>
      </div>
    </div>
  );
}
