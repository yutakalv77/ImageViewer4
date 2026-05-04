import { useEffect, useRef } from "react";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  items: {
    label: string;
    onClick: () => void;
    separator?: boolean;
  }[];
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
    adjustedX = x - menuWidth;
  }
  if (y + menuHeight > window.innerHeight) {
    adjustedY = y - menuHeight;
  }

  return (
    <div 
      ref={menuRef}
      className="context-menu"
      style={{ top: adjustedY, left: adjustedX }}
    >
      {items.map((item, idx) => (
        <div key={idx}>
          {item.separator && <div className="context-menu-separator"></div>}
          <div className="context-menu-item" onClick={() => { item.onClick(); onClose(); }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
