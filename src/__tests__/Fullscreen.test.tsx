import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

let mockIsFullscreen = false;

vi.mock('../hooks/useWindow', () => ({
  useWindow: () => ({
    os: 'windows',
    isMaximized: false,
    isFullscreen: mockIsFullscreen,
    handleDrag: vi.fn(),
    toggleMaximize: vi.fn(),
    toggleFullscreen: vi.fn(),
    setFullscreen: vi.fn(),
    startResizing: vi.fn(),
    minimize: vi.fn(),
    close: vi.fn(),
  }),
}));

vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-i18next")>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  };
});

vi.mock('../context/SettingsContext', () => ({
  useSettingsContext: () => ({
    isLoaded: true,
    startupFolderType: 'last',
    everythingEnabled: false,
    everythingMaxResults: 100,
    everythingCliPath: '',
    background: null,
    slideInterval: 3,
    slideLoop: true,
    viewMode: 'single',
    readingDirection: 'ltr',
    firstPageIsCover: false,
    thumbnailSize: 150,
    thumbnailSizeDefault: 150,
    updateThumbnailSize: vi.fn(),
    updateBackground: vi.fn(),
    updateViewMode: vi.fn(),
    resetThumbnailSize: vi.fn(),
    updateSlideInterval: vi.fn(),
    toggleSlideLoop: vi.fn(),
    updateReadingDirection: vi.fn(),
    toggleFirstPageIsCover: vi.fn(),
  }),
}));

vi.mock('../context/FileSystemContext', () => ({
  useFileSystemContext: () => ({
    currentPath: 'C:\\test\\folder',
    images: [],
    loading: false,
    error: null,
    loadDirectory: vi.fn(),
    everythingSearch: vi.fn(),
    searchFolders: vi.fn(),
    history: [],
    recordHistory: vi.fn(),
    isHistoryLoaded: true,
    displayEntries: [],
    isFavorite: vi.fn(() => false),
    toggleFavorite: vi.fn(),
    canGoBack: false,
    canGoForward: false,
    goBack: vi.fn(),
    goForward: vi.fn(),
    goUp: vi.fn(),
    openFolderDialog: vi.fn(),
    scrollTarget: undefined,
    saveScrollPosition: vi.fn(),
  }),
}));

vi.mock('../context/UIContext', () => ({
  useUIContext: () => ({
    viewerState: { isOpen: false, currentIndex: -1 },
    setViewerState: vi.fn(),
    persistentError: null,
    setPersistentError: vi.fn(),
    selectedInfoPath: null,
    setSelectedInfoPath: vi.fn(),
    isSettingsOpen: false,
    setIsSettingsOpen: vi.fn(),
    isFavoritesOpen: false,
    setIsFavoritesOpen: vi.fn(),
    isIntervalDialogOpen: false,
    setIsIntervalDialogOpen: vi.fn(),
  }),
}));

describe('Fullscreen behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsFullscreen = false;
  });

  it('通常表示（非全画面）時、メニューバーとトップバー（パス表示行）が表示されること', () => {
    mockIsFullscreen = false;
    render(<App />);

    // メニューバーが表示されている（role: navigation）
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    // トップバー（role: banner / header）が表示されている
    expect(screen.getByRole('banner')).toBeInTheDocument();
    // app-container に is-fullscreen クラスが付いていない
    const container = document.querySelector('.app-container');
    expect(container).not.toHaveClass('is-fullscreen');
  });

  it('全画面時、メニューバーとトップバー（パス表示行）が非表示になること', () => {
    mockIsFullscreen = true;
    render(<App />);

    // メニューバーが表示されない
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    // トップバーが表示されない
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    // app-container に is-fullscreen クラスが付与されている
    const container = document.querySelector('.app-container');
    expect(container).toHaveClass('is-fullscreen');
  });
});
