import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopBar, TopBarProps } from '../components/TopBar';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const dict: Record<string, string> = {
        'common.drag_hint': 'フォルダまたは画像をドロップ',
        'common.search_placeholder': '検索...',
        'common.nav_back': '戻る',
        'common.nav_forward': '進む',
        'common.nav_up': '上へ',
        'common.nav_exit_search': '検索終了',
        'common.back': '戻る',
      };
      return dict[key] || key;
    },
  }),
}));

describe('TopBar', () => {
  const defaultProps: TopBarProps = {
    currentPath: 'C:\\Users\\owner\\Pictures',
    canGoBack: true,
    canGoForward: true,
    onGoBack: vi.fn(),
    onGoForward: vi.fn(),
    onGoUp: vi.fn(),
    onLoadDirectory: vi.fn(),
    onSearch: vi.fn(),
    onDrag: vi.fn(),
    onMaximize: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('currentPath が空の場合、ドラッグヒントが表示されること', () => {
    render(<TopBar {...defaultProps} currentPath="" />);
    expect(screen.getByText('フォルダまたは画像をドロップ')).toBeInTheDocument();
  });

  it('currentPath が設定されている場合、パンくずリストが表示されクリックで遷移すること', () => {
    render(<TopBar {...defaultProps} currentPath="C:\\Users\\owner\\Pictures" />);

    const picturesCrumb = screen.getByText('Pictures');
    expect(picturesCrumb).toBeInTheDocument();

    fireEvent.click(picturesCrumb);
    expect(defaultProps.onLoadDirectory).toHaveBeenCalledWith('C:\\Users\\owner\\Pictures');
  });

  it('ナビゲーションボタン（戻る・進む・上へ）がクリックで呼び出されること', () => {
    render(<TopBar {...defaultProps} />);

    const backButton = screen.getByTitle('戻る');
    const forwardButton = screen.getByTitle('進む');
    const upButton = screen.getByTitle('上へ');

    fireEvent.click(backButton);
    expect(defaultProps.onGoBack).toHaveBeenCalledTimes(1);

    fireEvent.click(forwardButton);
    expect(defaultProps.onGoForward).toHaveBeenCalledTimes(1);

    fireEvent.click(upButton);
    expect(defaultProps.onGoUp).toHaveBeenCalledTimes(1);
  });

  it('検索入力でEnterキーを押すと onSearch が呼ばれること', () => {
    render(<TopBar {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('検索...');
    fireEvent.change(searchInput, { target: { value: 'cat' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(defaultProps.onSearch).toHaveBeenCalledWith('cat');
  });

  it('背景のダブルクリックで onMaximize が呼ばれ、ドラッグで onDrag が呼ばれること', () => {
    const { container } = render(<TopBar {...defaultProps} />);

    const topBar = container.querySelector('.top-bar')!;
    
    // mousedown で onDrag
    fireEvent.mouseDown(topBar);
    expect(defaultProps.onDrag).toHaveBeenCalledTimes(1);

    // doubleClick で onMaximize
    fireEvent.doubleClick(topBar);
    expect(defaultProps.onMaximize).toHaveBeenCalledTimes(1);
  });

  it('ナビゲーションボタン、パンくず、検索エリアのダブルクリックでは onMaximize が呼ばれないこと', () => {
    const { container } = render(<TopBar {...defaultProps} />);

    const navButtonsGroup = container.querySelector('.nav-buttons-group')!;
    const breadcrumbsList = container.querySelector('.breadcrumbs-list')!;
    const searchContainer = container.querySelector('.search-container')!;

    fireEvent.doubleClick(navButtonsGroup);
    expect(defaultProps.onMaximize).not.toHaveBeenCalled();

    fireEvent.doubleClick(breadcrumbsList);
    expect(defaultProps.onMaximize).not.toHaveBeenCalled();

    fireEvent.doubleClick(searchContainer);
    expect(defaultProps.onMaximize).not.toHaveBeenCalled();
  });

  it('パンくずリスト行の右クリックで親へのバブリングとデフォルト挙動が抑止され何も表示されないこと', () => {
    const parentContextMenu = vi.fn();
    const { container } = render(
      <div onContextMenu={parentContextMenu}>
        <TopBar {...defaultProps} />
      </div>
    );

    const breadcrumbsList = container.querySelector('.breadcrumbs-list')!;
    const topBar = container.querySelector('.top-bar')!;

    // パンくずリスト上の右クリック
    const breadcrumbEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    const preventDefaultSpy1 = vi.spyOn(breadcrumbEvent, 'preventDefault');
    const stopPropagationSpy1 = vi.spyOn(breadcrumbEvent, 'stopPropagation');
    breadcrumbsList.dispatchEvent(breadcrumbEvent);

    expect(stopPropagationSpy1).toHaveBeenCalled();
    expect(preventDefaultSpy1).toHaveBeenCalled();
    expect(parentContextMenu).not.toHaveBeenCalled();

    // TopBar 背景の右クリック
    const topBarEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    const preventDefaultSpy2 = vi.spyOn(topBarEvent, 'preventDefault');
    const stopPropagationSpy2 = vi.spyOn(topBarEvent, 'stopPropagation');
    topBar.dispatchEvent(topBarEvent);

    expect(stopPropagationSpy2).toHaveBeenCalled();
    expect(preventDefaultSpy2).toHaveBeenCalled();
    expect(parentContextMenu).not.toHaveBeenCalled();
  });

  it('検索入力欄の右クリックでも親へのバブリングは抑止されること', () => {
    const parentContextMenu = vi.fn();
    render(
      <div onContextMenu={parentContextMenu}>
        <TopBar {...defaultProps} />
      </div>
    );

    const searchInput = screen.getByPlaceholderText('検索...');
    const searchEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(searchEvent, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(searchEvent, 'stopPropagation');
    searchInput.dispatchEvent(searchEvent);

    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(preventDefaultSpy).not.toHaveBeenCalled();
    expect(parentContextMenu).not.toHaveBeenCalled();
  });
});

