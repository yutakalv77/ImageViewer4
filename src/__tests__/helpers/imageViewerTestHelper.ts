import { vi } from 'vitest';
import { EntryItem } from '../../types';

export const mockConvertFileSrc = vi.fn((path: string) => `asset://localhost/${encodeURIComponent(path)}`);
export const mockInvoke = vi.fn().mockResolvedValue({ data: [], mime: "image/jpeg" });

export const createDummyImages = (count: number = 2): EntryItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    name: `test${i + 1}.jpg`,
    path: `C:/images/test${i + 1}.jpg`,
    is_dir: false,
    thumbnail_path: null,
  }));
};

export const createDefaultImageViewerProps = (overrides?: Partial<any>) => {
  const dummyImages = createDummyImages(2);
  return {
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
    ...overrides,
  };
};
