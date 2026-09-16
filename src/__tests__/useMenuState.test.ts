import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMenuState } from '../hooks/useMenuState';

describe('useMenuState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('初期状態では activeMenu は null である', () => {
    const { result } = renderHook(() => useMenuState());
    expect(result.current.activeMenu).toBeNull();
  });

  it('メニュークリックで開閉をトグルできる', () => {
    const { result } = renderHook(() => useMenuState());

    act(() => {
      result.current.handleMenuClick('file');
    });
    expect(result.current.activeMenu).toBe('file');

    act(() => {
      result.current.handleMenuClick('file');
    });
    expect(result.current.activeMenu).toBeNull();
  });

  it('メニューが開いていない場合、ホバーしてもメニューは開かない', () => {
    const { result } = renderHook(() => useMenuState());

    act(() => {
      result.current.handleMenuHover('view');
    });
    expect(result.current.activeMenu).toBeNull();
  });

  it('メニューが開いている状態で他メニューにホバーすると即座に切り替わる', () => {
    const { result } = renderHook(() => useMenuState());

    // 「ファイル」メニューを開く
    act(() => {
      result.current.handleMenuClick('file');
    });
    expect(result.current.activeMenu).toBe('file');

    // 「表示」メニューにホバー
    act(() => {
      result.current.handleMenuHover('view');
    });
    expect(result.current.activeMenu).toBe('view');

    // 「スライド」メニューにホバー
    act(() => {
      result.current.handleMenuHover('slide');
    });
    expect(result.current.activeMenu).toBe('slide');
  });

  it('ホバーで切り替わった直後のクリックではメニューは閉じずに開いたまま維持される', () => {
    const { result } = renderHook(() => useMenuState());

    // 「ファイル」メニューを開く
    act(() => {
      result.current.handleMenuClick('file');
    });

    // 「表示」メニューにホバーして切り替える
    act(() => {
      result.current.handleMenuHover('view');
    });
    expect(result.current.activeMenu).toBe('view');

    // 切り替わり直後のクリック（50ms後）
    act(() => {
      vi.advanceTimersByTime(50);
      result.current.handleMenuClick('view');
    });
    // 閉じずに維持される
    expect(result.current.activeMenu).toBe('view');

    // 再度クリックすると閉じる
    act(() => {
      result.current.handleMenuClick('view');
    });
    expect(result.current.activeMenu).toBeNull();
  });

  it('ホバー切り替え後、一定時間（500ms以上）経過した後のクリックはトグルして閉じる', () => {
    const { result } = renderHook(() => useMenuState());

    act(() => {
      result.current.handleMenuClick('file');
      result.current.handleMenuHover('view');
    });
    expect(result.current.activeMenu).toBe('view');

    // 600ms 経過後にクリック
    act(() => {
      vi.advanceTimersByTime(600);
      result.current.handleMenuClick('view');
    });
    // 閉じる
    expect(result.current.activeMenu).toBeNull();
  });

  it('ボタンからマウスが離れた（handleMenuButtonLeave）後の再クリックは閉じる', () => {
    const { result } = renderHook(() => useMenuState());

    act(() => {
      result.current.handleMenuClick('file');
      result.current.handleMenuHover('view');
    });
    expect(result.current.activeMenu).toBe('view');

    act(() => {
      result.current.handleMenuButtonLeave('view');
      result.current.handleMenuClick('view');
    });
    expect(result.current.activeMenu).toBeNull();
  });

  it('closeMenu でメニューが閉じられる', () => {
    const { result } = renderHook(() => useMenuState());

    act(() => {
      result.current.handleMenuClick('file');
    });
    expect(result.current.activeMenu).toBe('file');

    act(() => {
      result.current.closeMenu();
    });
    expect(result.current.activeMenu).toBeNull();
  });
});
