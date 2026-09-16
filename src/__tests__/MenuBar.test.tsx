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
      };
      return translations[key] || key;
    },
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

const mockUpdateViewMode = vi.fn();
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

vi.mock('../context/UIContext', () => ({
  useUIContext: () => ({
    setIsFavoritesOpen: vi.fn(),
    setIsIntervalDialogOpen: vi.fn(),
    setIsSettingsOpen: vi.fn(),
  }),
}));

describe('MenuBar', () => {
  const defaultProps = {
    onStartSlideshow: vi.fn(),
    onRevealCurrentPath: vi.fn(),
    onLoadDirectory: vi.fn(),
    onOpenFolderDialog: vi.fn(),
  };

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
});
