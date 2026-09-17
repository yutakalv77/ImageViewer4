import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCachedThumbnailPath,
  setCachedThumbnailPath,
  clearThumbnailMemoryCache,
  subscribeThumbnailCache,
  clearThumbnailCacheListeners,
  extractUncachedImagePaths,
} from '../utils/thumbnailCache';
import { EntryItem } from '../types';

describe('thumbnailCache utility', () => {
  beforeEach(() => {
    clearThumbnailMemoryCache();
    clearThumbnailCacheListeners();
  });

  it('returns undefined for non-existent cache key', () => {
    expect(getCachedThumbnailPath('C:/photos/cat.jpg')).toBeUndefined();
  });

  it('sets and retrieves cached thumbnail path', () => {
    setCachedThumbnailPath('C:/photos/cat.jpg', 'C:/cache/cat_thumb.jpg');
    expect(getCachedThumbnailPath('C:/photos/cat.jpg')).toBe('C:/cache/cat_thumb.jpg');
  });

  it('clears all cached entries', () => {
    setCachedThumbnailPath('C:/photos/1.jpg', 'C:/cache/1_thumb.jpg');
    setCachedThumbnailPath('C:/photos/2.jpg', 'C:/cache/2_thumb.jpg');

    expect(getCachedThumbnailPath('C:/photos/1.jpg')).toBe('C:/cache/1_thumb.jpg');
    expect(getCachedThumbnailPath('C:/photos/2.jpg')).toBe('C:/cache/2_thumb.jpg');

    clearThumbnailMemoryCache();

    expect(getCachedThumbnailPath('C:/photos/1.jpg')).toBeUndefined();
    expect(getCachedThumbnailPath('C:/photos/2.jpg')).toBeUndefined();
  });

  describe('subscribeThumbnailCache', () => {
    it('notifies subscribers when new thumbnail path is cached', () => {
      const listener = vi.fn();
      const unsubscribe = subscribeThumbnailCache(listener);

      setCachedThumbnailPath('C:/photos/dog.jpg', 'C:/cache/dog_thumb.jpg');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith('C:/photos/dog.jpg', 'C:/cache/dog_thumb.jpg');

      unsubscribe();

      setCachedThumbnailPath('C:/photos/bird.jpg', 'C:/cache/bird_thumb.jpg');
      expect(listener).toHaveBeenCalledTimes(1); // Not called after unsubscribe
    });

    it('handles listener errors gracefully without interrupting other listeners', () => {
      const faultyListener = vi.fn(() => {
        throw new Error('Listener crash');
      });
      const goodListener = vi.fn();

      subscribeThumbnailCache(faultyListener);
      subscribeThumbnailCache(goodListener);

      setCachedThumbnailPath('C:/photos/flower.jpg', 'C:/cache/flower_thumb.jpg');

      expect(faultyListener).toHaveBeenCalled();
      expect(goodListener).toHaveBeenCalledWith('C:/photos/flower.jpg', 'C:/cache/flower_thumb.jpg');
    });
  });

  describe('extractUncachedImagePaths', () => {
    const sampleEntries: EntryItem[] = [
      { name: 'album', path: 'C:/photos/album', is_dir: true, thumbnail_path: null },
      { name: 'photo1.jpg', path: 'C:/photos/photo1.jpg', is_dir: false, thumbnail_path: null },
      { name: 'photo2.jpg', path: 'C:/photos/photo2.jpg', is_dir: false, thumbnail_path: 'C:/cache/p2.jpg' },
      { name: 'photo3.jpg', path: 'C:/photos/photo3.jpg', is_dir: false, thumbnail_path: null },
    ];

    it('filters out directories and disk-cached images', () => {
      const uncached = extractUncachedImagePaths(sampleEntries);
      expect(uncached).toEqual(['C:/photos/photo1.jpg', 'C:/photos/photo3.jpg']);
    });

    it('filters out memory-cached images when memory cache exists', () => {
      setCachedThumbnailPath('C:/photos/photo1.jpg', 'C:/cache/mem_p1.jpg');

      const uncached = extractUncachedImagePaths(sampleEntries);
      expect(uncached).toEqual(['C:/photos/photo3.jpg']);
    });

    it('returns empty array when all items are cached or directories', () => {
      const allCached: EntryItem[] = [
        { name: 'album', path: 'C:/photos/album', is_dir: true, thumbnail_path: null },
        { name: 'photo2.jpg', path: 'C:/photos/photo2.jpg', is_dir: false, thumbnail_path: 'C:/cache/p2.jpg' },
      ];
      expect(extractUncachedImagePaths(allCached)).toEqual([]);
    });
  });
});
