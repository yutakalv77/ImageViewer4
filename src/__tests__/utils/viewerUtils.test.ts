import { describe, it, expect } from 'vitest';
import {
  getNextIndex,
  getPrevIndex,
  DEFAULT_PAGE_NUMBER_POSITION,
  PAGE_NUMBER_POSITION_OPTIONS,
  isPageNumberPosition,
  getVisibleImages,
  formatViewerInfo,
  getPostDeleteNavigation,
} from '../../utils/viewerUtils';
import { EntryItem } from '../../types';

describe('viewerUtils', () => {
  const options = { totalImages: 10, viewMode: 'single' as const, firstPageIsCover: true };

  describe('single view mode', () => {
    it('should increment index in single mode', () => {
      expect(getNextIndex(0, { ...options, viewMode: 'single' })).toBe(1);
    });

    it('should decrement index in single mode', () => {
      expect(getPrevIndex(5, { ...options, viewMode: 'single' })).toBe(4);
    });

    it('should loop from last to first', () => {
      expect(getNextIndex(9, { ...options, viewMode: 'single' })).toBe(0);
    });

    it('should loop from first to last', () => {
      expect(getPrevIndex(0, { ...options, viewMode: 'single' })).toBe(9);
    });
  });

  describe('spread view mode (with cover)', () => {
    const spreadOptions = { ...options, viewMode: 'spread' as const, firstPageIsCover: true };

    it('should move from cover (0) to next pair (1)', () => {
      expect(getNextIndex(0, spreadOptions)).toBe(1);
    });

    it('should move from pair (1,2) to next pair (3)', () => {
      expect(getNextIndex(1, spreadOptions)).toBe(3);
      expect(getNextIndex(2, spreadOptions)).toBe(3);
    });

    it('should move backward from pair (3,4) to previous pair (1)', () => {
      expect(getPrevIndex(3, spreadOptions)).toBe(1);
      expect(getPrevIndex(4, spreadOptions)).toBe(1);
    });

    it('should move backward from first pair (1,2) to cover (0)', () => {
      expect(getPrevIndex(1, spreadOptions)).toBe(0);
      expect(getPrevIndex(2, spreadOptions)).toBe(0);
    });
  });

  describe('spread view mode (no cover)', () => {
    const spreadOptionsNoCover = { ...options, viewMode: 'spread' as const, firstPageIsCover: false };

    it('should move from pair (0,1) to next pair (2)', () => {
      expect(getNextIndex(0, spreadOptionsNoCover)).toBe(2);
      expect(getNextIndex(1, spreadOptionsNoCover)).toBe(2);
    });

    it('should move backward from pair (2,3) to previous pair (0)', () => {
      expect(getPrevIndex(2, spreadOptionsNoCover)).toBe(0);
      expect(getPrevIndex(3, spreadOptionsNoCover)).toBe(0);
    });
  });

  describe('safety and edge cases', () => {
    it('should safely handle 0 totalImages', () => {
      expect(getNextIndex(0, { ...options, totalImages: 0 })).toBe(0);
      expect(getPrevIndex(0, { ...options, totalImages: 0 })).toBe(0);
    });

    it('should safely handle negative currentIndex', () => {
      expect(getNextIndex(-1, { ...options, totalImages: 5 })).toBe(1);
      expect(getPrevIndex(-1, { ...options, totalImages: 5 })).toBe(4);
    });
  });

  describe('pageNumberPosition utilities', () => {
    it('should have default position as bottom-center', () => {
      expect(DEFAULT_PAGE_NUMBER_POSITION).toBe('bottom-center');
    });

    it('should define all 7 required positions in PAGE_NUMBER_POSITION_OPTIONS', () => {
      const positions = PAGE_NUMBER_POSITION_OPTIONS.map(opt => opt.value);
      expect(positions).toEqual([
        'top-center',
        'bottom-center',
        'top-left',
        'bottom-left',
        'top-right',
        'bottom-right',
        'hidden',
      ]);
    });

    it('should correctly identify valid page number positions', () => {
      expect(isPageNumberPosition('top-center')).toBe(true);
      expect(isPageNumberPosition('bottom-center')).toBe(true);
      expect(isPageNumberPosition('top-left')).toBe(true);
      expect(isPageNumberPosition('bottom-left')).toBe(true);
      expect(isPageNumberPosition('top-right')).toBe(true);
      expect(isPageNumberPosition('bottom-right')).toBe(true);
      expect(isPageNumberPosition('hidden')).toBe(true);
    });

    it('should reject invalid page number positions', () => {
      expect(isPageNumberPosition('center')).toBe(false);
      expect(isPageNumberPosition('top')).toBe(false);
      expect(isPageNumberPosition('bottom')).toBe(false);
      expect(isPageNumberPosition('')).toBe(false);
      expect(isPageNumberPosition(123)).toBe(false);
      expect(isPageNumberPosition(null)).toBe(false);
      expect(isPageNumberPosition(undefined)).toBe(false);
      expect(isPageNumberPosition({})).toBe(false);
    });
  });

  describe('getVisibleImages', () => {
    const dummyImages: EntryItem[] = [
      { name: '0.jpg', path: '/0.jpg', is_dir: false, thumbnail_path: null },
      { name: '1.jpg', path: '/1.jpg', is_dir: false, thumbnail_path: null },
      { name: '2.jpg', path: '/2.jpg', is_dir: false, thumbnail_path: null },
      { name: '3.jpg', path: '/3.jpg', is_dir: false, thumbnail_path: null },
    ];

    it('returns empty array when images list is empty', () => {
      expect(getVisibleImages([], 0, { viewMode: 'single', firstPageIsCover: true })).toEqual([]);
    });

    it('returns single image in single view mode', () => {
      const visible = getVisibleImages(dummyImages, 1, { viewMode: 'single', firstPageIsCover: true });
      expect(visible).toEqual([dummyImages[1]]);
    });

    it('returns only cover page when firstPageIsCover and index is 0 in spread mode', () => {
      const visible = getVisibleImages(dummyImages, 0, { viewMode: 'spread', firstPageIsCover: true });
      expect(visible).toEqual([dummyImages[0]]);
    });

    it('returns pair for non-cover pages in spread mode (LTR)', () => {
      const visible = getVisibleImages(dummyImages, 1, {
        viewMode: 'spread',
        firstPageIsCover: true,
        readingDirection: 'ltr',
      });
      expect(visible).toEqual([dummyImages[1], dummyImages[2]]);
    });

    it('reverses pair when readingDirection is rtl', () => {
      const visible = getVisibleImages(dummyImages, 1, {
        viewMode: 'spread',
        firstPageIsCover: true,
        readingDirection: 'rtl',
      });
      expect(visible).toEqual([dummyImages[2], dummyImages[1]]);
    });
  });

  describe('formatViewerInfo', () => {
    const mockT = (key: string, params?: Record<string, unknown>) => {
      if (key === 'slideshow.viewer_info_single') {
        return `${params?.page} / ${params?.total} - ${params?.name}`;
      }
      if (key === 'slideshow.viewer_info') {
        return `Page: ${params?.page} / ${params?.total}`;
      }
      return key;
    };

    it('formats single mode viewer info correctly', () => {
      const result = formatViewerInfo(mockT, {
        viewMode: 'single',
        currentIndex: 2,
        totalImages: 10,
        currentImageName: 'pic.png',
      });
      expect(result).toBe('3 / 10 - pic.png');
    });

    it('formats spread mode viewer info correctly', () => {
      const result = formatViewerInfo(mockT, {
        viewMode: 'spread',
        currentIndex: 2,
        totalImages: 10,
      });
      expect(result).toBe('Page: 3 / 10');
    });
  });

  describe('getPostDeleteNavigation', () => {
    it('残り枚数が1枚以下（0枚または1枚）の時、shouldClose: true を返すこと', () => {
      expect(getPostDeleteNavigation(0, 1)).toEqual({
        shouldClose: true,
        nextIndex: -1,
      });
      expect(getPostDeleteNavigation(0, 0)).toEqual({
        shouldClose: true,
        nextIndex: -1,
      });
    });

    it('末尾の画像を削除した時、前の画像のインデックスを返すこと', () => {
      // 5枚中インデックス4（最後の画像）を削除した場合 -> 新インデックスは 3
      expect(getPostDeleteNavigation(4, 5)).toEqual({
        shouldClose: false,
        nextIndex: 3,
      });
    });

    it('途中の画像を削除した時、同一インデックス（次の画像が繰り上がる）を返すこと', () => {
      // 5枚中インデックス1（2枚目）を削除した場合 -> 次の画像がインデックス1になる
      expect(getPostDeleteNavigation(1, 5)).toEqual({
        shouldClose: false,
        nextIndex: 1,
      });
    });

    it('先頭の画像を削除した時、インデックス0を返すこと', () => {
      // 5枚中インデックス0を削除した場合 -> 次の画像がインデックス0になる
      expect(getPostDeleteNavigation(0, 5)).toEqual({
        shouldClose: false,
        nextIndex: 0,
      });
    });
  });
});

