import { describe, it, expect } from 'vitest';
import { getNextIndex, getPrevIndex } from '../utils/viewerUtils';

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

    it('should safely handle out-of-bounds currentIndex', () => {
      expect(getNextIndex(100, { ...options, totalImages: 5 })).toBe(0);
      expect(getPrevIndex(100, { ...options, totalImages: 5 })).toBe(3);
    });
  });
});
