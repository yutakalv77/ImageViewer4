import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDismiss } from '../hooks/useDismiss';

describe('useDismiss hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('isOpenがtrueのとき、外側クリックでonDismissが呼ばれること', () => {
    const onDismiss = vi.fn();
    renderHook(() => useDismiss(true, onDismiss));

    const outsideDiv = document.createElement('div');
    document.body.appendChild(outsideDiv);

    const eventType = window.PointerEvent ? 'pointerdown' : 'mousedown';
    outsideDiv.dispatchEvent(new Event(eventType, { bubbles: true, cancelable: true }));

    expect(onDismiss).toHaveBeenCalledTimes(1);

    document.body.removeChild(outsideDiv);
  });

  it('ignoreSelectorsにマッチする要素のクリックではonDismissが呼ばれないこと', () => {
    const onDismiss = vi.fn();
    renderHook(() => useDismiss(true, onDismiss, { ignoreSelectors: ['.ignored-item'] }));

    const container = document.createElement('div');
    container.className = 'ignored-item';
    const inner = document.createElement('span');
    container.appendChild(inner);
    document.body.appendChild(container);

    const eventType = window.PointerEvent ? 'pointerdown' : 'mousedown';
    inner.dispatchEvent(new Event(eventType, { bubbles: true, cancelable: true }));

    expect(onDismiss).not.toHaveBeenCalled();

    document.body.removeChild(container);
  });

  it('Escapeキー押下時にonDismissが呼ばれること', () => {
    const onDismiss = vi.fn();
    renderHook(() => useDismiss(true, onDismiss));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('isOpenがfalseのときはイベントが発生してもonDismissが呼ばれないこと', () => {
    const onDismiss = vi.fn();
    renderHook(() => useDismiss(false, onDismiss));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
