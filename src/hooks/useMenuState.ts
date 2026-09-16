import { useState, useRef, useCallback } from 'react';
import { useDismiss } from './useDismiss';

export interface UseMenuStateOptions {
  ignoreSelectors?: string[];
  hoverSwitchClickThresholdMs?: number;
}

/**
 * メニューバーの開閉・ホバー切り替え・外部クリック検知を管理するカスタムフック
 * Windows メモ帳などの標準的なメニューバー挙動（メニューが開いている状態で他メニューにホバーすると即座に切り替わる）を提供します。
 */
export function useMenuState<T extends string = string>(options: UseMenuStateOptions = {}) {
  const {
    ignoreSelectors = ['.menu-dropdown', '.menu-button'],
    hoverSwitchClickThresholdMs = 500,
  } = options;

  const [activeMenu, setActiveMenu] = useState<T | null>(null);
  const lastHoverSwitchedMenu = useRef<T | null>(null);
  const hoverSwitchedAt = useRef<number>(0);

  const closeMenu = useCallback(() => {
    lastHoverSwitchedMenu.current = null;
    hoverSwitchedAt.current = 0;
    setActiveMenu(null);
  }, []);

  const handleMenuClick = useCallback((menuKey: T) => {
    setActiveMenu((current) => {
      if (current === menuKey) {
        const isRecentHoverSwitch =
          lastHoverSwitchedMenu.current === menuKey &&
          Date.now() - hoverSwitchedAt.current < hoverSwitchClickThresholdMs;

        if (isRecentHoverSwitch) {
          lastHoverSwitchedMenu.current = null;
          hoverSwitchedAt.current = 0;
          return menuKey;
        }

        lastHoverSwitchedMenu.current = null;
        hoverSwitchedAt.current = 0;
        return null;
      }

      lastHoverSwitchedMenu.current = null;
      hoverSwitchedAt.current = 0;
      return menuKey;
    });
  }, [hoverSwitchClickThresholdMs]);

  const handleMenuHover = useCallback((menuKey: T) => {
    setActiveMenu((current) => {
      if (current !== null && current !== menuKey) {
        lastHoverSwitchedMenu.current = menuKey;
        hoverSwitchedAt.current = Date.now();
        return menuKey;
      }
      return current;
    });
  }, []);

  const handleMenuButtonLeave = useCallback((menuKey: T) => {
    if (lastHoverSwitchedMenu.current === menuKey) {
      lastHoverSwitchedMenu.current = null;
      hoverSwitchedAt.current = 0;
    }
  }, []);

  useDismiss(activeMenu !== null, closeMenu, {
    ignoreSelectors,
  });

  return {
    activeMenu,
    setActiveMenu,
    closeMenu,
    handleMenuClick,
    handleMenuHover,
    handleMenuButtonLeave,
  };
}
