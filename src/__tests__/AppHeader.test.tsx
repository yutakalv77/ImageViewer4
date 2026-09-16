import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AppHeader } from '../components/AppHeader';

describe('AppHeader', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('固定表示状態（isPinned: true）ではトリガーゾーンがなく通常表示される', () => {
    render(
      <AppHeader isPinned={true}>
        <div data-testid="child-content">Header Content</div>
      </AppHeader>
    );

    expect(screen.queryByTestId('header-trigger-zone')).not.toBeInTheDocument();
    const header = screen.getByTestId('app-header');
    expect(header).not.toHaveClass('unpinned');
    expect(header).toHaveClass('visible');
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('未固定状態（isPinned: false）ではトリガーゾーンが表示され、ホバーでスライド表示される', () => {
    render(
      <AppHeader isPinned={false}>
        <div data-testid="child-content">Header Content</div>
      </AppHeader>
    );

    const triggerZone = screen.getByTestId('header-trigger-zone');
    expect(triggerZone).toBeInTheDocument();

    const header = screen.getByTestId('app-header');
    expect(header).toHaveClass('unpinned');
    expect(header).toHaveClass('hidden');

    // トリガーゾーンにホバーすると表示される
    act(() => {
      fireEvent.mouseEnter(triggerZone);
    });
    expect(header).toHaveClass('visible');

    // ヘッダーからマウスが離れると遅延後に非表示になる
    act(() => {
      fireEvent.mouseLeave(header);
      vi.advanceTimersByTime(300);
    });
    expect(header).toHaveClass('hidden');
  });

  it('未固定状態でも isLocked: true の時は非表示にならず表示を維持する', () => {
    const { rerender } = render(
      <AppHeader isPinned={false} isLocked={false}>
        <div>Header Content</div>
      </AppHeader>
    );

    const header = screen.getByTestId('app-header');
    expect(header).toHaveClass('hidden');

    // ロック状態（メニュー展開等）にする
    rerender(
      <AppHeader isPinned={false} isLocked={true}>
        <div>Header Content</div>
      </AppHeader>
    );
    expect(header).toHaveClass('visible');

    // マウスリーブしても隠れない
    act(() => {
      fireEvent.mouseLeave(header);
      vi.advanceTimersByTime(500);
    });
    expect(header).toHaveClass('visible');
  });
});
