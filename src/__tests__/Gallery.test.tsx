import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Gallery } from "../components/Gallery";
import { EntryItem } from "../types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "common.loading": "読み込み中...",
        "common.empty_gallery": "表示する画像がありません",
        "context_menu.reveal": "ファイルの場所を開く",
        "context_menu.copy_path": "パスをコピー",
        "context_menu.fav_add": "お気に入りに追加",
        "context_menu.fav_remove": "お気に入りから削除",
        "context_menu.rename": "名前の変更",
      };
      return translations[key] || key;
    },
  }),
  initReactI18next: {
    type: "3rdParty",
    init: () => {},
  },
}));

// Mock Tauri invoke for thumbnails
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(""),
  convertFileSrc: (path: string) => `asset://${path}`,
}));

describe("Gallery component with virtual grid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockEntries = (count: number): EntryItem[] => {
    return Array.from({ length: count }, (_, i) => ({
      name: `image_${i}.jpg`,
      path: `C:/photos/image_${i}.jpg`,
      is_dir: false,
      size: 1024 * (i + 1),
      modified: 1700000000 + i,
      thumbnail_path: `/cache/thumb_${i}.jpg`,
    }));
  };

  const defaultProps = {
    currentPath: "C:/photos",
    displayEntries: [] as EntryItem[],
    loading: false,
    thumbnailSize: 160,
    isFavorite: vi.fn().mockReturnValue(false),
    onEntryClick: vi.fn(),
    onRenameEntry: vi.fn(),
    onToggleFavorite: vi.fn(),
    onUpdateBackground: vi.fn(),
    onShowInfo: vi.fn(),
    onUpdateThumbnailSize: vi.fn(),
  };

  it("renders empty message when displayEntries is empty", () => {
    render(<Gallery {...defaultProps} displayEntries={[]} />);
    expect(screen.getByText("表示する画像がありません")).toBeInTheDocument();
  });

  it("renders loading overlay when loading is true", () => {
    render(<Gallery {...defaultProps} loading={true} />);
    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });

  it("renders visible entry cards and handles click", () => {
    const entries = createMockEntries(20);
    const onEntryClick = vi.fn();

    render(
      <Gallery
        {...defaultProps}
        displayEntries={entries}
        onEntryClick={onEntryClick}
      />
    );

    // Initial items should be rendered
    const firstCard = screen.getByText("image_0.jpg");
    expect(firstCard).toBeInTheDocument();

    act(() => {
      fireEvent.click(firstCard);
    });
    expect(onEntryClick).toHaveBeenCalledWith(entries[0]);
  });

  it("renders correctly with highPerformanceMode enabled", () => {
    const entries = createMockEntries(30);
    render(
      <Gallery
        {...defaultProps}
        displayEntries={entries}
        highPerformanceMode={true}
      />
    );

    const firstCard = screen.getByText("image_0.jpg");
    expect(firstCard).toBeInTheDocument();
  });
});
