import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MenuBar } from '../components/MenuBar';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'menu.file': 'ファイル',
        'menu.view': '表示',
        'menu.slide': 'スライド',
        'menu.favorites': 'お気に入り',
        'menu.history': '履歴',
        'menu.settings': '設定',
        'menu.help': 'ヘルプ',
        'file_menu.open_folder': 'フォルダを開く',
        'file_menu.reveal_in_explorer': 'エクスプローラーで表示',
        'file_menu.exit': '終了',
        'view_menu.single': '単ページ表示',
        'view_menu.spread': '見開き表示',
        'view_menu.sort_by': '表示順',
        'view_menu.sort_name': '名前順',
        'view_menu.sort_created': '作成日付順',
        'view_menu.sort_modified': '更新日付順',
        'view_menu.sort_size': 'サイズ順',
        'view_menu.sort_type': '種類順',
        'view_menu.sort_asc': '昇順',
        'view_menu.sort_desc': '降順',
        'slide_menu.start': '開始',
        'view_menu.pin_menubar': '上部バーを固定',
        'menu.pin_menubar': '上部バーを固定',
        'menu.unpin_menubar': '上部バーを自動的に隠す',
        'view_menu.transform': '回転・反転',
        'view_menu.rotate_cw': '時計回りに90°回転',
        'view_menu.rotate_ccw': '反時計回りに90°回転',
        'view_menu.flip_h': '左右反転',
        'view_menu.flip_v': '上下反転',
        'view_menu.reset_transform': '回転・反転をリセット',
      };
      return translations[key] || key;
    },
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

const mockUpdateViewMode = vi.fn();
const mockUpdateSortBy = vi.fn();
const mockUpdateSortOrder = vi.fn();
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
    updateViewMode: mockUpdateViewMode,
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

describe('MenuBar', () => {
  const defaultProps = {
    onStartSlideshow: vi.fn(),
    onRevealCurrentPath: vi.fn(),
    onLoadDirectory: vi.fn(),
    onOpenFolderDialog: vi.fn(),
  };

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
