import { useCallback, useRef, useEffect } from "react";

export interface UseResizeHandlesOptions {
  onStartResizing: (direction: string) => void;
  onVerticalDoubleClick: () => void;
  dragThreshold?: number;
  doubleClickDelay?: number;
}

export function useResizeHandles({
  onStartResizing,
  onVerticalDoubleClick,
  dragThreshold = 3,
  doubleClickDelay = 400,
}: UseResizeHandlesOptions) {
  const lastClickTimeRef = useRef<number>(0);
  const lastClickDirectionRef = useRef<string | null>(null);
  const lastTriggerTimeRef = useRef<number>(0);

  // クリーンアップ用のアクティブなリスナー参照
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  const triggerVerticalMaximize = useCallback(() => {
    const now = Date.now();
    // 直近400ms以内に実行済みの場合は二重実行を防止
    if (now - lastTriggerTimeRef.current < 400) {
      return;
    }
    lastTriggerTimeRef.current = now;
    onVerticalDoubleClick();
  }, [onVerticalDoubleClick]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;

      const direction = e.currentTarget.dataset.direction;
      if (!direction) return;

      const startX = e.clientX;
      const startY = e.clientY;
      let hasStartedDrag = false;

      // 既存リスナーのクリーンアップ
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }

      const cleanup = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        cleanupRef.current = null;
      };
      cleanupRef.current = cleanup;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const dx = Math.abs(moveEvent.clientX - startX);
        const dy = Math.abs(moveEvent.clientY - startY);

        if (!hasStartedDrag && (dx >= dragThreshold || dy >= dragThreshold)) {
          hasStartedDrag = true;
          cleanup();
          onStartResizing(direction);
        }
      };

      const onMouseUp = () => {
        cleanup();

        // 移動閾値未満でボタンが離された場合は「クリック」と判定
        if (!hasStartedDrag) {
          if (direction === "North" || direction === "South") {
            const now = Date.now();
            const timeSinceLastClick = now - lastClickTimeRef.current;
            const prevDir = lastClickDirectionRef.current;

            if (
              timeSinceLastClick <= doubleClickDelay &&
              (prevDir === "North" || prevDir === "South")
            ) {
              // ダブルクリック成立
              lastClickTimeRef.current = 0;
              lastClickDirectionRef.current = null;
              triggerVerticalMaximize();
            } else {
              // 1回目のクリックとして記録
              lastClickTimeRef.current = now;
              lastClickDirectionRef.current = direction;
            }
          }
        }
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [onStartResizing, dragThreshold, doubleClickDelay, triggerVerticalMaximize]
  );

  // ブラウザ本来の dblclick が発火した場合のフォールバックハンドラ
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const direction = e.currentTarget.dataset.direction;
      if (direction === "North" || direction === "South") {
        e.preventDefault();
        e.stopPropagation();
        triggerVerticalMaximize();
      }
    },
    [triggerVerticalMaximize]
  );

  return {
    handleMouseDown,
    handleDoubleClick,
  };
}
