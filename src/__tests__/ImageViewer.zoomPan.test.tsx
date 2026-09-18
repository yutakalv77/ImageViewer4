import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ImageViewer } from '../components/ImageViewer';
import { createDefaultImageViewerProps } from './helpers/imageViewerTestHelper';

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
      if (key === 'context_menu.actual_size') {
        return '実際のサイズ（100%）';
      }
      if (key === 'context_menu.fit_to_window') {
        return 'ウィンドウに合わせる';
      }
      return key;
    },
  }),
}));

describe('ImageViewer Pan and Zoom Support', () => {
  const defaultProps = createDefaultImageViewerProps();

  it('+キーと-キーで全体ズームイン/ズームアウトでき、ズームバッジが表示されること', () => {
    const { container } = render(<ImageViewer {...defaultProps} />);

    // 初期状態ではズームバッジは存在しない
    expect(container.querySelector('.viewer-zoom-badge')).toBeNull();

    // +キー押下でズームイン
    fireEvent.keyDown(window, { key: '+' });
    expect(screen.getByTestId('viewer-zoom-badge')).toBeInTheDocument();
    expect(screen.getByText('125%')).toBeInTheDocument();

    // -キー押下でズームアウト（100%になりバッジ消去）
    fireEvent.keyDown(window, { key: '-' });
    expect(container.querySelector('.viewer-zoom-badge')).toBeNull();
  });

  it('0キーでズームがリセットされること', () => {
    const { container } = render(<ImageViewer {...defaultProps} />);

    // ズームイン
    fireEvent.keyDown(window, { key: '+' });
    expect(container.querySelector('.viewer-zoom-badge')).not.toBeNull();

    // 0キーでリセット
    fireEvent.keyDown(window, { key: '0' });
    expect(container.querySelector('.viewer-zoom-badge')).toBeNull();
  });

  it('ズーム中にEscapeキーを押すとまずズームがリセットされ、ビューワーは閉じないこと', () => {
    const onClose = vi.fn();
    const { container } = render(<ImageViewer {...defaultProps} onClose={onClose} />);

    // ズームイン
    fireEvent.keyDown(window, { key: '+' });
    expect(container.querySelector('.viewer-zoom-badge')).not.toBeNull();

    // Escape押下
    fireEvent.keyDown(window, { key: 'Escape' });
    // ズームがリセットされる
    expect(container.querySelector('.viewer-zoom-badge')).toBeNull();
    // onCloseは呼ばれない
    expect(onClose).not.toHaveBeenCalled();

    // もう一度Escape押下でビューワーが閉じる
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ズームバッジをクリックするとズームがリセットされること', () => {
    const { container } = render(<ImageViewer {...defaultProps} />);

    // ズームイン
    fireEvent.keyDown(window, { key: '+' });
    const badge = screen.getByTestId('viewer-zoom-badge');

    fireEvent.click(badge);
    expect(container.querySelector('.viewer-zoom-badge')).toBeNull();
  });

  it('ダブルクリックで200%にズームし、再度ダブルクリックでリセットされること', () => {
    const { container } = render(<ImageViewer {...defaultProps} />);
    const overlay = container.querySelector('.viewer-overlay')!;

    // ダブルクリックでズーム
    fireEvent.doubleClick(overlay, { clientX: 500, clientY: 400 });
    expect(screen.getByText('200%')).toBeInTheDocument();

    // 再度ダブルクリックでリセット
    fireEvent.doubleClick(overlay, { clientX: 500, clientY: 400 });
    expect(container.querySelector('.viewer-zoom-badge')).toBeNull();
  });

  it('ズーム操作後2秒で半透明(fade-faded)になり、その後2秒で非表示になること', () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<ImageViewer {...defaultProps} />);

      // +キーでズームイン
      fireEvent.keyDown(window, { key: '+' });
      let badge = container.querySelector('.viewer-zoom-badge');
      expect(badge).not.toBeNull();
      expect(badge).toHaveClass('fade-active');

      // 2秒進める -> fade-faded になる
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      badge = container.querySelector('.viewer-zoom-badge');
      expect(badge).toHaveClass('fade-faded');

      // さらに2秒進める (合計4秒) -> 非表示 (hidden) になる
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      badge = container.querySelector('.viewer-zoom-badge');
      expect(badge).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('1キー押下で実際のサイズ（等倍）にズームし、再度1キー押下でリセットされること（トグル）', () => {
    const { container } = render(<ImageViewer {...defaultProps} />);

    // 1キーで等倍ズーム
    fireEvent.keyDown(window, { key: '1' });
    expect(container.querySelector('.viewer-zoom-badge')).not.toBeNull();

    // もう一度1キーでリセット
    fireEvent.keyDown(window, { key: '1' });
    expect(container.querySelector('.viewer-zoom-badge')).toBeNull();
  });

  it('右クリックメニューから「実際のサイズ（100%）」と「ウィンドウに合わせる」が実行できること', () => {
    const { container } = render(<ImageViewer {...defaultProps} />);
    const overlay = container.querySelector('.viewer-overlay')!;

    // 右クリック
    fireEvent.contextMenu(overlay, { clientX: 200, clientY: 200 });

    // 「実際のサイズ（100%）」をクリック
    const actualSizeItem = screen.getByText('実際のサイズ（100%）');
    expect(actualSizeItem).toBeInTheDocument();
    fireEvent.click(actualSizeItem);

    // ズームされる
    expect(container.querySelector('.viewer-zoom-badge')).not.toBeNull();

    // 再度右クリックして「ウィンドウに合わせる」をクリック
    fireEvent.contextMenu(overlay, { clientX: 200, clientY: 200 });
    const fitItem = screen.getByText('ウィンドウに合わせる');
    expect(fitItem).toBeInTheDocument();
    fireEvent.click(fitItem);

    // リセットされる
    expect(container.querySelector('.viewer-zoom-badge')).toBeNull();
  });

  it('画像上をダブルクリックした時にページ送り（onNavigate）が呼ばれず、ズームが実行されること', () => {
    vi.useFakeTimers();
    try {
      const onNavigate = vi.fn();
      const { container } = render(<ImageViewer {...defaultProps} onNavigate={onNavigate} />);
      const img = container.querySelector('img.viewer-image')!;

      // 画像上でダブルクリック
      fireEvent.click(img, { clientX: 500, clientY: 400 });
      fireEvent.doubleClick(img, { clientX: 500, clientY: 400 });

      // ズームされる
      expect(container.querySelector('.viewer-zoom-badge')).not.toBeNull();

      // ディレイ時間が経過してもページ送りは呼ばれない
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(onNavigate).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});


