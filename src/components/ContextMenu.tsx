import { useEffect, useRef } from "react";
import { ContextMenuItem } from "../utils/windowMenuUtils";
import "./ContextMenu.css";

export type { ContextMenuItem };

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  items: ContextMenuItem[];
}

export function ContextMenu({ x, y, onClose, items }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleScroll = () => onClose();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Adjust position if menu goes off screen
  const menuWidth = 200;
  const menuHeight = items.length * 30 + 10;
  let adjustedX = x;
  let adjustedY = y;

  if (x + menuWidth > window.innerWidth) {
    adjustedX = Math.max(0, x - menuWidth);
  }
  if (y + menuHeight > window.innerHeight) {
    adjustedY = Math.max(0, y - menuHeight);
  }

  return (
    <div 
      ref={menuRef}
      role="menu"
      className="context-menu"
      style={{ top: adjustedY, left: adjustedX }}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, idx) => (
        <div key={idx}>
          {item.separator && <div className="context-menu-separator" role="separator"></div>}
          {item.label && (
            <div 
              role="menuitem"
              aria-disabled={!!item.disabled}
              className={`context-menu-item ${item.disabled ? 'disabled' : ''}`} 
              onClick={(e) => { 
                e.stopPropagation(); 
                if (item.disabled) return;
                item.onClick?.(); 
                onClose(); 
              }}
            >
              <span className="context-menu-label">
                {item.icon && <span className="context-menu-icon">{item.icon}</span>}
                {item.label}
              </span>
              {item.shortcut && <span className="context-menu-shortcut">{item.shortcut}</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
