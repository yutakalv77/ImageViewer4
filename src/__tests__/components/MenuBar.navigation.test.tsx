import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MenuBar } from '../../components/MenuBar';
import { menuTranslations, createDefaultMenuBarProps } from '../helpers/menuBarTestHelper';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => menuTranslations[key] || key,
  }),
}));

vi.mock('../../hooks/useWindow', () => ({
  useWindow: () => ({
    os: 'windows',
    toggleMaximize: vi.fn(),
    minimize: vi.fn(),
    close: vi.fn(),
    handleDrag: vi.fn(),
  }),
}));

const mockUpdateViewMode = vi.fn();

vi.mock('../../context/SettingsContext', () => ({
  useSettingsContext: () => ({
    slideInterval: 3,
    slideLoop: true,
    viewMode: 'single',
    readingDirection: 'ltr',
    firstPageIsCover: false,
    thumbnailSize: 150,
    thumbnailSizeDefault: 150,
    sortBy: 'name',
    sortOrder: 'asc',
    isMenuBarPinned: true,
    toggleMenuBarPinned: vi.fn(),
    updateThumbnailSize: vi.fn(),
    resetThumbnailSize: vi.fn(),
    updateSlideInterval: vi.fn(),
    toggleSlideLoop: vi.fn(),
    updateViewMode: mockUpdateViewMode,
    updateReadingDirection: vi.fn(),
    toggleFirstPageIsCover: vi.fn(),
    updateSortBy: vi.fn(),
    updateSortOrder: vi.fn(),
  }),
}));

vi.mock('../../context/FileSystemContext', () => ({
  useFileSystemContext: () => ({
    history: [],
    loadDirectory: vi.fn(),
    openFolderDialog: vi.fn(),
  }),
}));

vi.mock('../../context/UIContext', () => {
  const getUI = () => ({
    setIsFavoritesOpen: vi.fn(),
    setIsIntervalDialogOpen: vi.fn(),
    setIsSettingsOpen: vi.fn(),
    viewerState: { isOpen: true, currentIndex: 0 },
    imageTransform: { rotation: 0, flipH: false, flipV: false },
    isTransformed: false,
    rotateClockwise: vi.fn(),
    rotateCounterClockwise: vi.fn(),
    toggleFlipH: vi.fn(),
    toggleFlipV: vi.fn(),
    resetTransform: vi.fn(),
    zoomActualSize: vi.fn(),
    zoomFit: vi.fn(),
    zoomControls: null,
  });
  return {
    useUIContext: getUI,
    useOptionalUIContext: getUI,
  };
});

describe('MenuBar Navigation & Interactions', () => {
  const defaultProps = createDefaultMenuBarProps();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('メニューをクリックするとドロップダウンが開き、外部をクリックすると閉じる', () => {
    render(
      <div>
        <MenuBar {...defaultProps} />
        <div data-testid="outside-area">Outside Area</div>
      </div>
    );

    // 最初はドロップダウンが開いていない
    expect(screen.queryByText('フォルダを開く')).not.toBeInTheDocument();

    // 「ファイル」メニューをクリック
    fireEvent.click(screen.getByText('ファイル'));
    expect(screen.getByText('フォルダを開く')).toBeInTheDocument();

    // 外部の領域をクリック
    const outsideArea = screen.getByTestId('outside-area');
    const pointerEventType = window.PointerEvent ? 'pointerdown' : 'mousedown';
    fireEvent(
      outsideArea,
      new Event(pointerEventType, { bubbles: true, cancelable: true })
    );

    // ドロップダウンが閉じる
    expect(screen.queryByText('フォルダを開く')).not.toBeInTheDocument();
  });

  it('Escapeキーを押すとメニューが閉じる', () => {
    render(
      <div>
        <MenuBar {...defaultProps} />
      </div>
    );

    // 「ファイル」メニューを開く
    fireEvent.click(screen.getByText('ファイル'));
    expect(screen.getByText('フォルダを開く')).toBeInTheDocument();

    // Escapeキーを押す
    fireEvent.keyDown(window, { key: 'Escape' });

    // ドロップダウンが閉じる
    expect(screen.queryByText('フォルダを開く')).not.toBeInTheDocument();
  });

  it('開いているメニューボタン自身を再クリックするとトグルして閉じる', () => {
    render(
      <div>
        <MenuBar {...defaultProps} />
      </div>
    );

    const fileButton = screen.getByText('ファイル');

    // 1回目のクリックで開く
    fireEvent.click(fileButton);
    expect(screen.getByText('フォルダを開く')).toBeInTheDocument();

    // 2回目のクリックで閉じる
    fireEvent.click(fileButton);
    expect(screen.queryByText('フォルダを開く')).not.toBeInTheDocument();
  });

  it('別のメニューボタンをクリックすると、前のメニューが閉じて新しいメニューが開く', () => {
    render(
      <div>
        <MenuBar {...defaultProps} />
      </div>
    );

    // 「ファイル」メニューを開く
    fireEvent.click(screen.getByText('ファイル'));
    expect(screen.getByText('フォルダを開く')).toBeInTheDocument();

    // 「表示」メニューをクリック
    fireEvent.click(screen.getByText('表示'));
    expect(screen.queryByText('フォルダを開く')).not.toBeInTheDocument();
    expect(screen.getByText('単ページ表示')).toBeInTheDocument();
  });

  it('ドロップダウンメニュー内の項目をクリックした時は外部クリック処理で閉じない', () => {
    render(
      <div>
        <MenuBar {...defaultProps} />
      </div>
    );

    // 「表示」メニューを開く
    fireEvent.click(screen.getByText('表示'));
    const singleOption = screen.getByText('単ページ表示');
    expect(singleOption).toBeInTheDocument();

    // ドロップダウン内の「単ページ表示」をクリック
    fireEvent.click(singleOption);
    expect(mockUpdateViewMode).toHaveBeenCalledWith('single');
    // メニューは開いたまま
    expect(screen.getByText('単ページ表示')).toBeInTheDocument();
  });

  it('メニューが開いていない状態でメニューボタンにマウスを移動してもメニューは開かない', () => {
    render(
      <div>
        <MenuBar {...defaultProps} />
      </div>
    );

    // 最初は閉じた状態
    expect(screen.queryByText('単ページ表示')).not.toBeInTheDocument();

    // 「表示」ボタンにホバーする
    fireEvent.mouseEnter(screen.getByText('表示'));

    // 開かないこと
    expect(screen.queryByText('単ページ表示')).not.toBeInTheDocument();
  });

  it('メニューが開いている状態で他メニューにマウスカーソルを移動（mouseEnter）すると、前のメニューが閉じて新しいメニューが開く（Windows メモ帳挙動）', () => {
    render(
      <div>
        <MenuBar {...defaultProps} />
      </div>
    );

    // 「ファイル」メニューをクリックして開く
    fireEvent.click(screen.getByText('ファイル'));
    expect(screen.getByText('フォルダを開く')).toBeInTheDocument();
    expect(screen.queryByText('単ページ表示')).not.toBeInTheDocument();

    // 「表示」メニューボタンにマウスを移動する（mouseEnter）
    fireEvent.mouseEnter(screen.getByText('表示'));

    // 「ファイル」メニューが閉じ、「表示」メニューが開くこと
    expect(screen.queryByText('フォルダを開く')).not.toBeInTheDocument();
    expect(screen.getByText('単ページ表示')).toBeInTheDocument();

    // さらに「スライド」メニューボタンにマウスを移動する
    fireEvent.mouseEnter(screen.getByText('スライド'));

    // 「表示」メニューが閉じ、「スライド」メニューが開くこと
    expect(screen.queryByText('単ページ表示')).not.toBeInTheDocument();
    expect(screen.getByText('開始')).toBeInTheDocument();
  });

  it('ホバーでメニューを開いた直後にそのメニューボタンをクリックしても閉じずに開いたままになる', () => {
    render(
      <div>
        <MenuBar {...defaultProps} />
      </div>
    );

    // 「ファイル」メニューを開く
    fireEvent.click(screen.getByText('ファイル'));
    expect(screen.getByText('フォルダを開く')).toBeInTheDocument();

    // 「表示」メニューにマウスを移動して開く
    const viewButton = screen.getByText('表示');
    fireEvent.mouseEnter(viewButton);
    expect(screen.getByText('単ページ表示')).toBeInTheDocument();

    // そのまま「表示」ボタンをクリックする
    fireEvent.click(viewButton);

    // 閉じずに開いたまま維持されること
    expect(screen.getByText('単ページ表示')).toBeInTheDocument();

    // 再度クリックすると閉じること
    fireEvent.click(viewButton);
    expect(screen.queryByText('単ページ表示')).not.toBeInTheDocument();
  });
});
