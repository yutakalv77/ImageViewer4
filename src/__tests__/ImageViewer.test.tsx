import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';

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

