import { useState, useRef, useEffect, useCallback, type MouseEvent as ReactMouseEvent } from "react";

export interface UseDraggableModalOptions {
  initialSize?: { w: number; h: number };
  minSize?: { w: number; h: number };
  isOpen: boolean;
}

/**
 * モーダルウィンドウのドラッグ移動・リサイズ・中央配置状態を管理するカスタムフック
 */
export function useDraggableModal({
  initialSize = { w: 700, h: 500 },
  minSize = { w: 400, h: 300 },
  isOpen,
}: UseDraggableModalOptions) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState(initialSize);
  const [isInitialized, setIsInitialized] = useState(false);

  const posRef = useRef(pos);
  posRef.current = pos;

  const sizeRef = useRef(size);
  sizeRef.current = size;

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const isResizing = useRef<string | null>(null);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // モーダルオープン時に画面中央へ初期配置
  useEffect(() => {
    if (isOpen && !isInitialized) {
      const x = Math.max(0, (window.innerWidth - size.w) / 2);
      const y = Math.max(0, (window.innerHeight - size.h) / 2);
      setPos({ x, y });
      setIsInitialized(true);
    }
    if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen, isInitialized, size.w, size.h]);

  const handleMouseDown = useCallback((e: ReactMouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - posRef.current.x, y: e.clientY - posRef.current.y };
  }, []);

  const handleResizeStart = useCallback((e: ReactMouseEvent, dir: string) => {
    e.stopPropagation();
    isResizing.current = dir;
    resizeStart.current = { x: e.clientX, y: e.clientY, w: sizeRef.current.w, h: sizeRef.current.h };
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging.current) {
      setPos({
        x: e.clientX - dragStart.current.x,
        y: Math.max(0, e.clientY - dragStart.current.y),
      });
    } else if (isResizing.current) {
      const dx = e.clientX - resizeStart.current.x;
      const dy = e.clientY - resizeStart.current.y;

      setSize((prev) => {
        const next = { ...prev };
        if (isResizing.current?.includes("e")) next.w = Math.max(minSize.w, resizeStart.current.w + dx);
        if (isResizing.current?.includes("s")) next.h = Math.max(minSize.h, resizeStart.current.h + dy);
        return next;
      });
    }
  }, [minSize.w, minSize.h]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    isResizing.current = null;
  }, []);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isOpen, handleMouseMove, handleMouseUp]);

  return {
    pos,
    size,
    handleMouseDown,
    handleResizeStart,
  };
}
