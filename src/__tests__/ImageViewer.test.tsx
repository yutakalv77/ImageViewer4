import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';

import { ImageViewer } from '../components/ImageViewer';
import { EntryItem, PageNumberPosition } from '../types';

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      if (key === 'slideshow.viewer_info_single' && params) {
        return `${params.page} / ${params.total} - ${params.name}`;
      }
      return key;
    },
  }),
}));

describe('ImageViewer Page Number Position', () => {
  const dummyImages: EntryItem[] = [
    {
      name: 'test1.jpg',
      path: 'C:/images/test1.jpg',
      is_dir: false,
      thumbnail_path: null,
    },
    {
      name: 'test2.jpg',
      path: 'C:/images/test2.jpg',
      is_dir: false,
      thumbnail_path: null,
    },
  ];

  const defaultProps = {
    isOpen: true,
    currentIndex: 0,
    images: dummyImages,
    viewMode: 'single' as const,
    readingDirection: 'rtl' as const,
    firstPageIsCover: true,
    onClose: vi.fn(),
    onNavigate: vi.fn(),
    onShowInfo: vi.fn(),
    onManualInteraction: vi.fn(),
  };

  it('renders with default bottom-center position when prop is omitted', () => {
    const { container } = render(<ImageViewer {...defaultProps} />);
    const overlay = container.querySelector('.viewer-overlay');
    expect(overlay).toHaveClass('page-pos-bottom-center');

    const info = container.querySelector('.viewer-info');
    expect(info).toBeInTheDocument();
    expect(info).toHaveClass('pos-bottom-center');
    expect(info).toHaveTextContent('1 / 2 - test1.jpg');
  });

  const positions: PageNumberPosition[] = [
    'top-center',
    'bottom-center',
    'top-left',
    'bottom-left',
    'top-right',
    'bottom-right',
  ];

  positions.forEach((pos) => {
    it(`renders page indicator with pos-${pos} when pageNumberPosition="${pos}"`, () => {
      const { container } = render(
        <ImageViewer {...defaultProps} pageNumberPosition={pos} />
      );
      const overlay = container.querySelector('.viewer-overlay');
      expect(overlay).toHaveClass(`page-pos-${pos}`);

      const info = container.querySelector('.viewer-info');
      expect(info).toBeInTheDocument();
      expect(info).toHaveClass(`pos-${pos}`);
    });
  });

  it('does not render page indicator when pageNumberPosition="hidden"', () => {
    const { container } = render(
      <ImageViewer {...defaultProps} pageNumberPosition="hidden" />
    );
    const overlay = container.querySelector('.viewer-overlay');
    expect(overlay).toHaveClass('page-pos-hidden');

    const info = container.querySelector('.viewer-info');
    expect(info).toBeNull();
  });
});

describe('ImageViewer Rename Support', () => {
  const dummyImages: EntryItem[] = [
    {
      name: 'test1.jpg',
      path: 'C:/images/test1.jpg',
      is_dir: false,
      thumbnail_path: null,
    },
  ];

  const defaultProps = {
    isOpen: true,
    currentIndex: 0,
    images: dummyImages,
    viewMode: 'single' as const,
    readingDirection: 'rtl' as const,
    firstPageIsCover: true,
    onClose: vi.fn(),
    onNavigate: vi.fn(),
    onShowInfo: vi.fn(),
    onManualInteraction: vi.fn(),
    onRenameImage: vi.fn(),
  };

  it('F2キー押下でリネームモーダルが表示されること', async () => {
    const { getByRole } = render(<ImageViewer {...defaultProps} />);
    fireEvent.keyDown(window, { key: 'F2' });

    await waitFor(() => {
      const input = getByRole('textbox') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.value).toBe('test1.jpg');
    });
  });

  it('右クリックメニューに「名前を変更」が表示され、クリックでモーダルが開くこと', async () => {
    const { container, findByText, getByRole } = render(<ImageViewer {...defaultProps} />);
    const overlay = container.querySelector('.viewer-overlay')!;

    fireEvent.contextMenu(overlay, { clientX: 100, clientY: 100 });

    const renameMenuItem = await findByText('context_menu.rename');
    expect(renameMenuItem).toBeInTheDocument();

    fireEvent.click(renameMenuItem);

    await waitFor(() => {
      const input = getByRole('textbox') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.value).toBe('test1.jpg');
    });
  });
});

describe('ImageViewer Magnifier Support', () => {
  const dummyImages: EntryItem[] = [
    {
      name: 'test1.jpg',
      path: 'C:/images/test1.jpg',
      is_dir: false,
      thumbnail_path: null,
    },
  ];

  const defaultProps = {
    isOpen: true,
    currentIndex: 0,
    images: dummyImages,
    viewMode: 'single' as const,
    readingDirection: 'rtl' as const,
    firstPageIsCover: true,
    onClose: vi.fn(),
    onNavigate: vi.fn(),
    onShowInfo: vi.fn(),
    onManualInteraction: vi.fn(),
  };

  it('Zキー押下で拡大鏡モードがトグルされること', () => {
    const { container } = render(<ImageViewer {...defaultProps} />);
    const overlay = container.querySelector('.viewer-overlay')!;

    expect(overlay).not.toHaveClass('magnifier-mode');

    // Zキー押下でON
    fireEvent.keyDown(window, { key: 'z' });
    expect(overlay).toHaveClass('magnifier-mode');

    // 再度Zキー押下でOFF
    fireEvent.keyDown(window, { key: 'z' });
    expect(overlay).not.toHaveClass('magnifier-mode');
  });

  it('右クリックメニューに「拡大鏡」が表示され、クリックでトグルされること', async () => {
    const { container, findByText } = render(<ImageViewer {...defaultProps} />);
    const overlay = container.querySelector('.viewer-overlay')!;

    fireEvent.contextMenu(overlay, { clientX: 100, clientY: 100 });

    const magnifierItem = await findByText('context_menu.magnifier');
    expect(magnifierItem).toBeInTheDocument();

    fireEvent.click(magnifierItem);
    expect(overlay).toHaveClass('magnifier-mode');
  });

  it('拡大鏡モード中にEscapeキーを押すと拡大鏡モードが終了し、ビューワー自体は閉じないこと', () => {
    const onClose = vi.fn();
    const { container } = render(<ImageViewer {...defaultProps} onClose={onClose} />);
    const overlay = container.querySelector('.viewer-overlay')!;

    // 拡大鏡をONにする
    fireEvent.keyDown(window, { key: 'z' });
    expect(overlay).toHaveClass('magnifier-mode');

    // Escapeキーを押下
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(overlay).not.toHaveClass('magnifier-mode');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('拡大鏡モード中に+キーや-キーでズーム倍率が変更されること', () => {
    render(<ImageViewer {...defaultProps} />);

    // 拡大鏡をONにする
    fireEvent.keyDown(window, { key: 'z' });

    // 初期倍率は 2.5x
    expect(screen.getByText('2.5x')).toBeInTheDocument();

    // +キーでズームイン
    fireEvent.keyDown(window, { key: '+' });
    expect(screen.getByText('3.0x')).toBeInTheDocument();

    // -キーでズームアウト
    fireEvent.keyDown(window, { key: '-' });
    expect(screen.getByText('2.5x')).toBeInTheDocument();

    // Ctrl + + でズームイン
    fireEvent.keyDown(window, { key: '+', ctrlKey: true });
    expect(screen.getByText('3.0x')).toBeInTheDocument();

    // Ctrl + - でズームアウト
    fireEvent.keyDown(window, { key: '-', ctrlKey: true });
    expect(screen.getByText('2.5x')).toBeInTheDocument();
  });

  it('拡大鏡モード中にShift+-やテンキーShift++でレンズサイズが調整されること', () => {
    const { container } = render(<ImageViewer {...defaultProps} />);

    // 拡大鏡をONにする
    fireEvent.keyDown(window, { key: 'z' });

    // レンズ初期サイズは 240px
    let lens = container.querySelector('.magnifier-lens') as HTMLElement;
    expect(lens).toHaveStyle({ width: '240px', height: '240px' });

    // Shift + テンキー+ でレンズ拡大 (240 + 20 = 260px)
    fireEvent.keyDown(window, { key: '+', code: 'NumpadAdd', shiftKey: true });
    lens = container.querySelector('.magnifier-lens') as HTMLElement;
    expect(lens).toHaveStyle({ width: '260px', height: '260px' });

    // Shift + - でレンズ縮小 (260 - 20 = 240px)
    fireEvent.keyDown(window, { key: '-', code: 'Minus', shiftKey: true });
    lens = container.querySelector('.magnifier-lens') as HTMLElement;
    expect(lens).toHaveStyle({ width: '240px', height: '240px' });
  });
});


