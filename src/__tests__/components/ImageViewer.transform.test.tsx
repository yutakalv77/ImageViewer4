import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ImageViewer } from '../../components/ImageViewer';
import { createDefaultImageViewerProps } from '../helpers/imageViewerTestHelper';

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: vi.fn((path: string) => `asset://localhost/${encodeURIComponent(path)}`),
  invoke: vi.fn().mockResolvedValue({ data: [], mime: 'image/jpeg' }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      if (key === 'slideshow.viewer_info_single' && params) {
        return `${params.page} / ${params.total} - ${params.name}`;
      }
      return key;
    },
  }),
}));

describe('ImageViewer Rotation and Flip Support', () => {
  const defaultProps = createDefaultImageViewerProps();

  it('Rキー押下で時計回りに90°回転し、回転バッジが表示されること', () => {
    render(<ImageViewer {...defaultProps} />);

    fireEvent.keyDown(window, { key: 'r' });
    const badge = screen.getByTestId('viewer-transform-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('90° ↻');

    const img = screen.getByRole('img');
    expect(img.style.transform).toContain('rotate(90deg)');
  });

  it('Shift+R または Lキー押下で反時計回りに回転すること', () => {
    render(<ImageViewer {...defaultProps} />);

    fireEvent.keyDown(window, { key: 'R', shiftKey: true });
    let badge = screen.getByTestId('viewer-transform-badge');
    expect(badge).toHaveTextContent('270° ↻');

    fireEvent.keyDown(window, { key: 'l' });
    badge = screen.getByTestId('viewer-transform-badge');
    expect(badge).toHaveTextContent('180° ↻');
  });

  it('Hキーで左右反転、Vキーで上下反転されること', () => {
    render(<ImageViewer {...defaultProps} />);

    fireEvent.keyDown(window, { key: 'h' });
    let badge = screen.getByTestId('viewer-transform-badge');
    expect(badge).toHaveTextContent('view_menu.flip_h');

    fireEvent.keyDown(window, { key: 'v' });
    badge = screen.getByTestId('viewer-transform-badge');
    expect(badge).toHaveTextContent('view_menu.flip_both');
  });

  it('Alt+0キーまたはバッジクリックで回転・反転がリセットされること', () => {
    const { container } = render(<ImageViewer {...defaultProps} />);

    fireEvent.keyDown(window, { key: 'r' });
    let badge = screen.getByTestId('viewer-transform-badge');
    expect(badge).toBeInTheDocument();

    // Alt+0でリセット
    fireEvent.keyDown(window, { key: '0', altKey: true });
    expect(container.querySelector('[data-testid="viewer-transform-badge"]')).toBeNull();

    // 再度回転してバッジクリックでリセット
    fireEvent.keyDown(window, { key: 'r' });
    badge = screen.getByTestId('viewer-transform-badge');
    fireEvent.click(badge);
    expect(container.querySelector('[data-testid="viewer-transform-badge"]')).toBeNull();
  });

  it('右クリックメニューから回転・反転が実行できること', () => {
    const { container } = render(<ImageViewer {...defaultProps} />);
    const overlay = container.querySelector('.viewer-overlay')!;

    // 右クリック
    fireEvent.contextMenu(overlay, { clientX: 200, clientY: 200 });

    // メニュー項目「view_menu.rotate_cw」をクリック
    const rotateCwItem = screen.getByText('view_menu.rotate_cw');
    fireEvent.click(rotateCwItem);

    const badge = screen.getByTestId('viewer-transform-badge');
    expect(badge).toHaveTextContent('90° ↻');
  });

  it('ページ切り替え時に回転・反転が自動リセットされること', () => {
    const { rerender, container } = render(<ImageViewer {...defaultProps} currentIndex={0} />);

    fireEvent.keyDown(window, { key: 'r' });
    expect(screen.getByTestId('viewer-transform-badge')).toBeInTheDocument();

    // ページ変更 (currentIndex: 1)
    rerender(<ImageViewer {...defaultProps} currentIndex={1} />);
    expect(container.querySelector('[data-testid="viewer-transform-badge"]')).toBeNull();
  });

  it('回転操作後2秒で半透明(fade-faded)になり、その後2秒で非表示になること', () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<ImageViewer {...defaultProps} />);

      // Rキーで回転
      fireEvent.keyDown(window, { key: 'r' });
      let badge = container.querySelector('.viewer-transform-badge');
      expect(badge).not.toBeNull();
      expect(badge).toHaveClass('fade-active');

      // 2秒進める -> fade-faded になる
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      badge = container.querySelector('.viewer-transform-badge');
      expect(badge).toHaveClass('fade-faded');

      // さらに2秒進める (合計4秒) -> 非表示 (hidden) になる
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      badge = container.querySelector('.viewer-transform-badge');
      expect(badge).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('回転バッジにホバー中はアクティブ状態を維持し、離れてから2秒で半透明・4秒で非表示になること', () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<ImageViewer {...defaultProps} />);

      // Rキーで回転
      fireEvent.keyDown(window, { key: 'r' });
      let badge = container.querySelector('.viewer-transform-badge')!;
      expect(badge).toHaveClass('fade-active');

      // ホバー
      fireEvent.mouseEnter(badge);

      // 3秒経過してもホバー中なので fade-active のまま
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      badge = container.querySelector('.viewer-transform-badge')!;
      expect(badge).toHaveClass('fade-active');

      // マウスが離れる
      fireEvent.mouseLeave(badge);

      // 2秒後 -> fade-faded
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      badge = container.querySelector('.viewer-transform-badge')!;
      expect(badge).toHaveClass('fade-faded');

      // さらに2秒後 -> 非表示
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(container.querySelector('.viewer-transform-badge')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
