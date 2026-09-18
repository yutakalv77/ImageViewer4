import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MenuBar } from '../components/MenuBar';
import { menuTranslations, createDefaultMenuBarProps } from './helpers/menuBarTestHelper';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => menuTranslations[key] || key,
  }),
}));

const mockToggleMaximize = vi.fn();
const mockHandleDrag = vi.fn();

vi.mock('../hooks/useWindow', () => ({
  useWindow: () => ({
    os: 'windows',
    toggleMaximize: mockToggleMaximize,
    minimize: vi.fn(),
    close: vi.fn(),
    handleDrag: mockHandleDrag,
  }),
}));

const mockToggleMenuBarPinned = vi.fn();

let mockSettings = {
  isMenuBarPinned: true,
};

vi.mock('../context/SettingsContext', () => ({
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
    isMenuBarPinned: mockSettings.isMenuBarPinned,
    toggleMenuBarPinned: mockToggleMenuBarPinned,
    updateThumbnailSize: vi.fn(),
    resetThumbnailSize: vi.fn(),
    updateSlideInterval: vi.fn(),
    toggleSlideLoop: vi.fn(),
    updateViewMode: vi.fn(),
    updateReadingDirection: vi.fn(),
    toggleFirstPageIsCover: vi.fn(),
    updateSortBy: vi.fn(),
    updateSortOrder: vi.fn(),
  }),
}));

vi.mock('../context/FileSystemContext', () => ({
  useFileSystemContext: () => ({
    history: [],
    loadDirectory: vi.fn(),
    openFolderDialog: vi.fn(),
  }),
}));

vi.mock('../context/UIContext', () => {
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

describe('MenuBar Window Controls & Pinned State', () => {
  const defaultProps = createDefaultMenuBarProps();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSettings.isMenuBarPinned = true;
  });

  it('固定表示状態（デフォルト）ではピンボタンが pinned で表示される', () => {
    mockSettings.isMenuBarPinned = true;
    render(
      <div>
        <MenuBar {...defaultProps} />
      </div>
    );

    // ピンボタンが存在し、pinned クラスを持つ
    const pinButton = screen.getByTitle('上部バーを自動的に隠す');
    expect(pinButton).toBeInTheDocument();
    expect(pinButton).toHaveClass('pinned');

    // ピンボタンをクリックすると toggleMenuBarPinned が呼ばれる
    fireEvent.click(pinButton);
    expect(mockToggleMenuBarPinned).toHaveBeenCalled();
  });

  it('「表示」メニュー内の「上部バーを固定」をクリックすると toggleMenuBarPinned が呼ばれる', () => {
    mockSettings.isMenuBarPinned = true;
    render(
      <div>
        <MenuBar {...defaultProps} />
      </div>
    );

    // 「表示」メニューを開く
    fireEvent.click(screen.getByText('表示'));
    const pinMenuItem = screen.getByText('上部バーを固定');
    expect(pinMenuItem).toBeInTheDocument();

    // クリック
    fireEvent.click(pinMenuItem);
    expect(mockToggleMenuBarPinned).toHaveBeenCalled();
  });

  it('未固定状態（isMenuBarPinned: false）ではピンボタンが unpinned クラスを持つ', () => {
    mockSettings.isMenuBarPinned = false;
    render(
      <div>
        <MenuBar {...defaultProps} />
      </div>
    );

    // ピンボタンは unpinned クラスを持つ
    const pinButton = screen.getByTitle('上部バーを固定');
    expect(pinButton).toBeInTheDocument();
    expect(pinButton).toHaveClass('unpinned');

    // ピンボタンをクリックすると toggleMenuBarPinned が呼ばれる
    fireEvent.click(pinButton);
    expect(mockToggleMenuBarPinned).toHaveBeenCalled();
  });

  it('メニューの開閉状態の変化が onMenuOpenChange に通知される', () => {
    const mockMenuOpenChange = vi.fn();
    render(
      <div>
        <MenuBar {...defaultProps} onMenuOpenChange={mockMenuOpenChange} />
      </div>
    );

    // 最初はメニューが閉じている
    expect(mockMenuOpenChange).toHaveBeenCalledWith(false);

    // 「ファイル」メニューをクリックして開く
    fireEvent.click(screen.getByText('ファイル'));
    expect(mockMenuOpenChange).toHaveBeenCalledWith(true);

    // 再度クリックして閉じる
    fireEvent.click(screen.getByText('ファイル'));
    expect(mockMenuOpenChange).toHaveBeenCalledWith(false);
  });

  it('背景のダブルクリックで toggleMaximize が呼ばれ、メニュー項目や右側領域では呼ばれないこと', () => {
    const { container } = render(
      <div>
        <MenuBar {...defaultProps} />
      </div>
    );

    const menuBar = container.querySelector('.menu-bar')!;
    const menuItemsContainer = container.querySelector('.menu-items-container')!;
    const menuBarRight = container.querySelector('.menu-bar-right')!;

    // メニュー項目群のダブルクリックでは呼ばれない
    fireEvent.doubleClick(menuItemsContainer);
    expect(mockToggleMaximize).not.toHaveBeenCalled();

    // 右側領域（ピンボタン等）のダブルクリックでは呼ばれない
    fireEvent.doubleClick(menuBarRight);
    expect(mockToggleMaximize).not.toHaveBeenCalled();

    // 背景領域のダブルクリックで toggleMaximize が呼ばれる
    fireEvent.doubleClick(menuBar);
    expect(mockToggleMaximize).toHaveBeenCalledTimes(1);
  });
});
