import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FavoritesModal } from "../../components/FavoritesModal";
import { FavoriteEntry } from "../../types";

const mockUpdateAllFavorites = vi.fn();
const mockLoadDirectory = vi.fn();
const mockSetIsFavoritesOpen = vi.fn();
const mockSetViewerState = vi.fn();

const sampleFavorites: FavoriteEntry[] = [
  { path: "C:/photos/dog.png", addedAt: 1700000001000 },
  { path: "C:/photos/cat.jpg", addedAt: 1700000000000 },
];

let mockFileSystemState = {
  favorites: sampleFavorites,
  updateAllFavorites: mockUpdateAllFavorites,
  loadDirectory: mockLoadDirectory,
};

let mockUIState = {
  isFavoritesOpen: true,
  setIsFavoritesOpen: mockSetIsFavoritesOpen,
  setViewerState: mockSetViewerState,
};

vi.mock("../../context/FileSystemContext", () => ({
  useFileSystemContext: () => mockFileSystemState,
}));

vi.mock("../../context/UIContext", () => ({
  useUIContext: () => mockUIState,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "favorites.title": "お気に入り管理",
        "favorites.empty": "お気に入りは登録されていません",
        "common.path": "パス",
        "common.date": "登録日時",
        "common.operation": "操作",
        "common.show": "表示",
        "common.delete": "削除",
        "common.cancel": "キャンセル",
        "common.ok": "OK",
      };
      return map[key] || key;
    },
  }),
}));

describe("FavoritesModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFileSystemState = {
      favorites: [...sampleFavorites],
      updateAllFavorites: mockUpdateAllFavorites,
      loadDirectory: mockLoadDirectory,
    };
    mockUIState = {
      isFavoritesOpen: true,
      setIsFavoritesOpen: mockSetIsFavoritesOpen,
      setViewerState: mockSetViewerState,
    };
  });

  it("isFavoritesOpenがfalseの時は何も描画されないこと", () => {
    mockUIState.isFavoritesOpen = false;
    const { container } = render(<FavoritesModal />);
    expect(container.firstChild).toBeNull();
  });

  it("ウィンドウ形式のタイトルバー、リサイズハンドル、お気に入り一覧、表示ボタンが描画されること", () => {
    const { container } = render(<FavoritesModal />);

    // タイトル
    expect(screen.getByText("お気に入り管理")).toBeInTheDocument();

    // ウィンドウタイトルバーとリサイズハンドルの存在確認（設定画面と同様の構造）
    expect(container.querySelector(".window-title-bar")).toBeInTheDocument();
    expect(container.querySelector(".win-resize-handle.e")).toBeInTheDocument();
    expect(container.querySelector(".win-resize-handle.s")).toBeInTheDocument();
    expect(container.querySelector(".win-resize-handle.se")).toBeInTheDocument();

    // テーブル項目
    expect(screen.getByText("C:/photos/cat.jpg")).toBeInTheDocument();
    expect(screen.getByText("C:/photos/dog.png")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "表示" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "削除" })).toHaveLength(2);
    expect(screen.getByText("キャンセル")).toBeInTheDocument();
    expect(screen.getByText("OK")).toBeInTheDocument();
  });

  it("タイトルバーの閉じるボタンをクリックした時にsetIsFavoritesOpen(false)が呼ばれること", () => {
    render(<FavoritesModal />);

    const closeBtn = screen.getByRole("button", { name: "Close" });
    fireEvent.click(closeBtn);

    expect(mockSetIsFavoritesOpen).toHaveBeenCalledWith(false);
  });

  it("フッターのキャンセルボタンをクリックした時にsetIsFavoritesOpen(false)が呼ばれること", () => {
    render(<FavoritesModal />);

    const cancelBtn = screen.getByRole("button", { name: "キャンセル" });
    fireEvent.click(cancelBtn);

    expect(mockSetIsFavoritesOpen).toHaveBeenCalledWith(false);
  });

  it("パスヘッダーをクリックするとパス順にソートされ、インジケーターが表示されること", () => {
    render(<FavoritesModal />);

    const pathHeader = screen.getByText("パス").closest("th")!;
    
    // 1回目クリック: 昇順
    fireEvent.click(pathHeader);

    expect(screen.getByText("▲")).toBeInTheDocument();
    const rowsBefore = screen.getAllByRole("row");
    // ヘッダー行を除く最初のデータ行は cat.jpg
    expect(rowsBefore[1]).toHaveTextContent("C:/photos/cat.jpg");
    expect(rowsBefore[2]).toHaveTextContent("C:/photos/dog.png");

    // 2回目クリック: 降順
    fireEvent.click(pathHeader);

    expect(screen.getByText("▼")).toBeInTheDocument();
    const rowsAfter = screen.getAllByRole("row");
    expect(rowsAfter[1]).toHaveTextContent("C:/photos/dog.png");
    expect(rowsAfter[2]).toHaveTextContent("C:/photos/cat.jpg");
  });

  it("登録日時ヘッダーをキーボード（Enter/Space）で操作した時に登録日時順にソートされること", () => {
    render(<FavoritesModal />);

    const dateHeader = screen.getByText("登録日時").closest("th")!;
    
    // Enterキー: 昇順（1700000000000 -> 1700000001000）
    fireEvent.keyDown(dateHeader, { key: "Enter" });

    expect(screen.getByText("▲")).toBeInTheDocument();
    let rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("C:/photos/cat.jpg");

    // Spaceキー: 降順（1700000001000 -> 1700000000000）
    fireEvent.keyDown(dateHeader, { key: " " });

    expect(screen.getByText("▼")).toBeInTheDocument();
    rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("C:/photos/dog.png");
  });

  it("削除ボタンをクリックすると一覧から除外され、OK押下時に変更が保存されること", () => {
    render(<FavoritesModal />);

    const deleteButtons = screen.getAllByRole("button", { name: "削除" });
    fireEvent.click(deleteButtons[0]);

    // dog.png が削除されること
    expect(screen.queryByText("C:/photos/dog.png")).not.toBeInTheDocument();
    expect(screen.getByText("C:/photos/cat.jpg")).toBeInTheDocument();

    // OKボタン押下
    const okBtn = screen.getByRole("button", { name: "OK" });
    fireEvent.click(okBtn);

    expect(mockUpdateAllFavorites).toHaveBeenCalledWith([
      { path: "C:/photos/cat.jpg", addedAt: 1700000000000 },
    ]);
    expect(mockSetIsFavoritesOpen).toHaveBeenCalledWith(false);
  });

  it("「表示」ボタンをクリックした時にディレクトリ読み込みとビューワー初期化が行われること", () => {
    render(<FavoritesModal />);

    const showButtons = screen.getAllByRole("button", { name: "表示" });
    fireEvent.click(showButtons[0]);

    expect(mockSetViewerState).toHaveBeenCalledWith({ isOpen: false, currentIndex: -1 });
    expect(mockLoadDirectory).toHaveBeenCalledWith("C:/photos/dog.png");
    expect(mockSetIsFavoritesOpen).toHaveBeenCalledWith(false);
  });

  it("パスセルをクリックしてもナビゲーションは発火しないこと（通常テキスト表示）", () => {
    render(<FavoritesModal />);

    const pathCell = screen.getByText("C:/photos/dog.png");
    fireEvent.click(pathCell);

    expect(mockLoadDirectory).not.toHaveBeenCalled();
    expect(mockSetIsFavoritesOpen).not.toHaveBeenCalled();
  });

  it("お気に入りが空の場合、空メッセージが表示されること", () => {
    mockFileSystemState.favorites = [];
    render(<FavoritesModal />);

    expect(screen.getByText("お気に入りは登録されていません")).toBeInTheDocument();
  });
});
