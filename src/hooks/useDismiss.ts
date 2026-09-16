import { useEffect } from "react";

interface UseDismissOptions {
  /**
   * クリックされても onDismiss を呼ばない要素のセレクタ群（例: ['.menu-dropdown', '.menu-button']）
   */
  ignoreSelectors?: string[];
  /**
   * Escapeキー押下時に onDismiss を呼ぶか（デフォルト: true）
   */
  escapeKey?: boolean;
  /**
   * ウィンドウのフォーカスが外れた時に onDismiss を呼ぶか（デフォルト: true）
   */
  blur?: boolean;
}

/**
 * メニューやポップオーバーの外側クリック、Escapeキー、ウィンドウフォーカス喪失を検知して閉じるカスタムフック
 */
export function useDismiss(
  isOpen: boolean,
  onDismiss: () => void,
  options: UseDismissOptions = {}
) {
  const {
    ignoreSelectors = [],
    escapeKey = true,
    blur = true,
  } = options;

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: Event) => {
      const target = e.target as Node | null;
      if (!target) return;

      if (target instanceof Element && ignoreSelectors.length > 0) {
        for (const selector of ignoreSelectors) {
          if (target.closest(selector)) {
            return;
          }
        }
      }

      onDismiss();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (escapeKey && e.key === "Escape") {
        onDismiss();
      }
    };

    const handleWindowBlur = () => {
      if (blur) {
        onDismiss();
      }
    };

    const eventType = window.PointerEvent ? "pointerdown" : "mousedown";
    window.addEventListener(eventType, handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener(eventType, handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [isOpen, onDismiss, ignoreSelectors.join(","), escapeKey, blur]);
}
