import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ViewerImageItem } from '../components/ViewerImageItem';
import * as useImageSourceModule from '../hooks/useImageSource';
import { EntryItem } from '../types';

describe('ViewerImageItem', () => {
  const dummyImage: EntryItem = {
    name: 'test.jpg',
    path: 'C:\\test\\test.jpg',
    is_dir: false,
    thumbnail_path: null,
  };

  const onNext = vi.fn();
  const onPrev = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('正常時に画像が表示されること', () => {
    vi.spyOn(useImageSourceModule, 'useImageSource').mockReturnValue({
      src: 'asset://localhost/test.jpg',
      isLoading: false,
      error: null,
    });

    render(
      <ViewerImageItem
        image={dummyImage}
        readingDirection="ltr"
        onNext={onNext}
        onPrev={onPrev}
      />
    );

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'asset://localhost/test.jpg');
    expect(img).toHaveAttribute('alt', 'test.jpg');
  });

  it('LTRで右側クリック時に遅延後に onNext が呼ばれること', () => {
    vi.useFakeTimers();
    try {
      vi.spyOn(useImageSourceModule, 'useImageSource').mockReturnValue({
        src: 'asset://localhost/test.jpg',
        isLoading: false,
        error: null,
      });

      render(
        <ViewerImageItem
          image={dummyImage}
          readingDirection="ltr"
          onNext={onNext}
          onPrev={onPrev}
        />
      );

      const img = screen.getByRole('img');
      vi.spyOn(img, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 200,
        height: 200,
        right: 200,
        bottom: 200,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      fireEvent.click(img, { clientX: 150 });
      // クリック直後はタイマー待ちのためまだ呼ばれない
      expect(onNext).not.toHaveBeenCalled();

      // タイマーを進めると呼ばれる
      act(() => {
        vi.advanceTimersByTime(250);
      });
      expect(onNext).toHaveBeenCalledTimes(1);
      expect(onPrev).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('RTLで右側クリック時に遅延後に onPrev が呼ばれること', () => {
    vi.useFakeTimers();
    try {
      vi.spyOn(useImageSourceModule, 'useImageSource').mockReturnValue({
        src: 'asset://localhost/test.jpg',
        isLoading: false,
        error: null,
      });

      render(
        <ViewerImageItem
          image={dummyImage}
          readingDirection="rtl"
          onNext={onNext}
          onPrev={onPrev}
        />
      );

      const img = screen.getByRole('img');
      vi.spyOn(img, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 200,
        height: 200,
        right: 200,
        bottom: 200,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      fireEvent.click(img, { clientX: 150 });
      expect(onPrev).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(250);
      });
      expect(onPrev).toHaveBeenCalledTimes(1);
      expect(onNext).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('ダブルクリック時はクリックタイマーがキャンセルされ、ページ送りは呼ばれず onDoubleClick が呼ばれること', () => {
    vi.useFakeTimers();
    try {
      const onDoubleClick = vi.fn();
      vi.spyOn(useImageSourceModule, 'useImageSource').mockReturnValue({
        src: 'asset://localhost/test.jpg',
        isLoading: false,
        error: null,
      });

      render(
        <ViewerImageItem
          image={dummyImage}
          readingDirection="ltr"
          onNext={onNext}
          onPrev={onPrev}
          onDoubleClick={onDoubleClick}
        />
      );

      const img = screen.getByRole('img');
      vi.spyOn(img, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 200,
        height: 200,
        right: 200,
        bottom: 200,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      // 1回目のクリック
      fireEvent.click(img, { clientX: 150 });

      // ダブルクリック
      fireEvent.doubleClick(img, { clientX: 150 });
      expect(onDoubleClick).toHaveBeenCalledTimes(1);

      // 時間が経過しても onNext / onPrev は呼ばれない
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(onNext).not.toHaveBeenCalled();
      expect(onPrev).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('エラー時にエラーUIが表示され、再試行ボタンを押せること', () => {
    vi.spyOn(useImageSourceModule, 'useImageSource').mockReturnValue({
      src: null,
      isLoading: false,
      error: new Error('Failed to load'),
    });

    render(
      <ViewerImageItem
        image={dummyImage}
        readingDirection="ltr"
        onNext={onNext}
        onPrev={onPrev}
      />
    );

    expect(screen.getByText('画像を読み込めませんでした')).toBeInTheDocument();
    expect(screen.getByText('test.jpg')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: '再試行' });
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);
  });

  it('isMagnifierActive が true の時はクリックしても画像送りが実行されないこと', () => {
    vi.spyOn(useImageSourceModule, 'useImageSource').mockReturnValue({
      src: 'asset://localhost/test.jpg',
      isLoading: false,
      error: null,
    });

    render(
      <ViewerImageItem
        image={dummyImage}
        readingDirection="ltr"
        isMagnifierActive={true}
        onNext={onNext}
        onPrev={onPrev}
      />
    );

    const img = screen.getByRole('img');
    vi.spyOn(img, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 200,
      height: 200,
      right: 200,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.click(img, { clientX: 150 });
    expect(onNext).not.toHaveBeenCalled();
    expect(onPrev).not.toHaveBeenCalled();
  });

  it('transform が指定された場合にスタイルが適用されること', () => {
    vi.spyOn(useImageSourceModule, 'useImageSource').mockReturnValue({
      src: 'asset://localhost/test.jpg',
      isLoading: false,
      error: null,
    });

    render(
      <ViewerImageItem
        image={dummyImage}
        readingDirection="ltr"
        transform={{ rotation: 90, flipH: true, flipV: false }}
        onNext={onNext}
        onPrev={onPrev}
      />
    );

    const img = screen.getByRole('img');
    expect(img.style.transform).toContain('rotate(90deg)');
    expect(img.style.transform).toContain('scaleX(-1)');
  });
});
