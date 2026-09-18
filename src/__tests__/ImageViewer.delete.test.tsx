import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ImageViewer } from '../components/ImageViewer';
import { EntryItem } from '../types';
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
      if (key === 'context_menu.trash') {
        return 'ごみ箱へ移動';
      }
      return key;
    },
  }),
}));

describe('ImageViewer Delete Support', () => {
  const images: EntryItem[] = [
    { name: 'img1.jpg', path: 'C:/images/img1.jpg', is_dir: false, thumbnail_path: null },
    { name: 'img2.jpg', path: 'C:/images/img2.jpg', is_dir: false, thumbnail_path: null },
  ];

  const defaultProps = createDefaultImageViewerProps();

  it('右クリックメニューからごみ箱へ移動をクリックすると onDeleteImage が呼ばれること', async () => {
    const onDeleteImage = vi.fn().mockResolvedValue(true);
    const onNavigate = vi.fn();
    const { container } = render(
      <ImageViewer
        {...defaultProps}
        images={images}
        currentIndex={0}
        onDeleteImage={onDeleteImage}
        onNavigate={onNavigate}
      />
    );

    const overlay = container.querySelector('.viewer-overlay')!;
    fireEvent.contextMenu(overlay);

    const trashItem = screen.getByText('ごみ箱へ移動');
    expect(trashItem).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(trashItem);
    });

    expect(onDeleteImage).toHaveBeenCalledWith('C:/images/img1.jpg');
    expect(onNavigate).toHaveBeenCalledWith(0);
  });

  it('末尾の画像でDeleteキーを押すと削除後に前の画像へ遷移すること', async () => {
    const onDeleteImage = vi.fn().mockResolvedValue(true);
    const onNavigate = vi.fn();
    render(
      <ImageViewer
        {...defaultProps}
        images={images}
        currentIndex={1}
        onDeleteImage={onDeleteImage}
        onNavigate={onNavigate}
      />
    );

    await act(async () => {
      fireEvent.keyDown(window, { key: 'Delete' });
    });

    expect(onDeleteImage).toHaveBeenCalledWith('C:/images/img2.jpg');
    expect(onNavigate).toHaveBeenCalledWith(0);
  });

  it('残り1枚の画像を削除した時、ビューワーが閉じられること', async () => {
    const singleImage: EntryItem[] = [
      { name: 'only.jpg', path: 'C:/images/only.jpg', is_dir: false, thumbnail_path: null },
    ];
    const onDeleteImage = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();
    render(
      <ImageViewer
        {...defaultProps}
        images={singleImage}
        currentIndex={0}
        onDeleteImage={onDeleteImage}
        onClose={onClose}
      />
    );

    await act(async () => {
      fireEvent.keyDown(window, { key: 'Delete' });
    });

    expect(onDeleteImage).toHaveBeenCalledWith('C:/images/only.jpg');
    expect(onClose).toHaveBeenCalled();
  });

  it('ZIP内仮想画像の場合はDeleteキーを押しても onDeleteImage が呼ばれないこと', async () => {
    const zipImages: EntryItem[] = [
      { name: 'inner.jpg', path: 'C:/archive.zip::inner.jpg', is_dir: false, thumbnail_path: null },
    ];
    const onDeleteImage = vi.fn().mockResolvedValue(true);
    render(
      <ImageViewer
        {...defaultProps}
        images={zipImages}
        currentIndex={0}
        onDeleteImage={onDeleteImage}
      />
    );

    await act(async () => {
      fireEvent.keyDown(window, { key: 'Delete' });
    });

    expect(onDeleteImage).not.toHaveBeenCalled();
  });
});
