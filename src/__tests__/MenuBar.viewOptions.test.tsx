import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MenuBar } from '../components/MenuBar';
import { menuTranslations, createDefaultMenuBarProps } from './helpers/menuBarTestHelper';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => menuTranslations[key] || key,
  }),
}));

vi.mock('../hooks/useWindow', () => ({
  useWindow: () => ({
    os: 'windows',
    toggleMaximize: vi.fn(),
    minimize: vi.fn(),
    close: vi.fn(),
    handleDrag: vi.fn(),
  }),
}));

const mockUpdateSortBy = vi.fn();
const mockUpdateSortOrder = vi.fn();

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
    isMenuBarPinned: true,
    toggleMenuBarPinned: vi.fn(),
    updateThumbnailSize: vi.fn(),
    resetThumbnailSize: vi.fn(),
    updateSlideInterval: vi.fn(),
    toggleSlideLoop: vi.fn(),
    updateViewMode: vi.fn(),
    updateReadingDirection: vi.fn(),
    toggleFirstPageIsCover: vi.fn(),
    updateSortBy: mockUpdateSortBy,
    updateSortOrder: mockUpdateSortOrder,
  }),
}));

vi.mock('../context/FileSystemContext', () => ({
  useFileSystemContext: () => ({
    history: [],
    loadDirectory: vi.fn(),
    openFolderDialog: vi.fn(),
  }),
}));

const mockRotateClockwise = vi.fn();
const mockRotateCounterClockwise = vi.fn();
const mockToggleFlipH = vi.fn();
const mockToggleFlipV = vi.fn();
const mockResetTransform = vi.fn();

let mockViewerState = {
  isOpen: true,
  currentIndex: 0,
};

let mockImageTransform = {
  rotation: 0,
  flipH: false,
  flipV: false,
};

vi.mock('../context/UIContext', () => {
  const getUI = () => ({
    setIsFavoritesOpen: vi.fn(),
    setIsIntervalDialogOpen: vi.fn(),
    setIsSettingsOpen: vi.fn(),
    viewerState: mockViewerState,
    imageTransform: mockImageTransform,
    isTransformed: mockImageTransform.rotation !== 0 || mockImageTransform.flipH || mockImageTransform.flipV,
    rotateClockwise: mockRotateClockwise,
    rotateCounterClockwise: mockRotateCounterClockwise,
    toggleFlipH: mockToggleFlipH,
    toggleFlipV: mockToggleFlipV,
    resetTransform: mockResetTransform,
  });
  return {
    useUIContext: getUI,
    useOptionalUIContext: getUI,
  };
});

describe('MenuBar View Options & Transform Submenu', () => {
  const defaultProps = createDefaultMenuBarProps();

  beforeEach(() => {
    vi.clearAllMocks();
    mockViewerState = {
      isOpen: true,
      currentIndex: 0,
    };
    mockImageTransform = {
      rotation: 0,
      flipH: false,
      flipV: false,
    };
  });

  it('表示順サブメニューを展開し、ソート順や昇順・降順を切り替えられること', () => {
    render(
      <div>
        <MenuBar {...defaultProps} />
      </div>
    );

    // 「表示」メニューを開く
    fireEvent.click(screen.getByText('表示'));
    expect(screen.getByText('表示順')).toBeInTheDocument();

    // 「表示順」をクリックしてサブメニューを展開
    fireEvent.click(screen.getByText('表示順'));

    // サブメニュー内の各項目が表示されていること
    expect(screen.getByText('名前順')).toBeInTheDocument();
    expect(screen.getByText('作成日付順')).toBeInTheDocument();
    expect(screen.getByText('更新日付順')).toBeInTheDocument();
    expect(screen.getByText('サイズ順')).toBeInTheDocument();
    expect(screen.getByText('種類順')).toBeInTheDocument();
    expect(screen.getByText('昇順')).toBeInTheDocument();
    expect(screen.getByText('降順')).toBeInTheDocument();

    // 「作成日付順」をクリック
    fireEvent.click(screen.getByText('作成日付順'));
    expect(mockUpdateSortBy).toHaveBeenCalledWith('created');

    // 「降順」をクリック
    fireEvent.click(screen.getByText('降順'));
    expect(mockUpdateSortOrder).toHaveBeenCalledWith('desc');
  });

  it('「表示」メニュー内の「回転・反転」サブメニューから時計回り・反転・リセットを実行できること', () => {
    render(<MenuBar {...defaultProps} />);

    // 「表示」メニューを開く
    fireEvent.click(screen.getByText('表示'));

    // 「回転・反転」サブメニュー項目が存在することを確認
    const transformSubmenu = screen.getByText('回転・反転');
    expect(transformSubmenu).toBeInTheDocument();

    // サブメニューを展開
    fireEvent.mouseEnter(transformSubmenu.closest('li')!);

    // 時計回りに90°回転をクリック
    const rotateCwItem = screen.getByText('時計回りに90°回転');
    fireEvent.click(rotateCwItem);
    expect(mockRotateClockwise).toHaveBeenCalledTimes(1);

    // 再度表示メニューを開いて反時計回り
    fireEvent.click(screen.getByText('表示'));
    fireEvent.mouseEnter(screen.getByText('回転・反転').closest('li')!);
    fireEvent.click(screen.getByText('反時計回りに90°回転'));
    expect(mockRotateCounterClockwise).toHaveBeenCalledTimes(1);

    // 左右反転
    fireEvent.click(screen.getByText('表示'));
    fireEvent.mouseEnter(screen.getByText('回転・反転').closest('li')!);
    fireEvent.click(screen.getByText('左右反転'));
    expect(mockToggleFlipH).toHaveBeenCalledTimes(1);

    // 上下反転
    fireEvent.click(screen.getByText('表示'));
    fireEvent.mouseEnter(screen.getByText('回転・反転').closest('li')!);
    fireEvent.click(screen.getByText('上下反転'));
    expect(mockToggleFlipV).toHaveBeenCalledTimes(1);
  });
});
