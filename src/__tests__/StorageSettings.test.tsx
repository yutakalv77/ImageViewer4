import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StorageSettings } from "../components/settings/StorageSettings";
import { invoke } from "@tauri-apps/api/core";
import { confirm } from "@tauri-apps/plugin-dialog";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "settings.storage_title": "データ保存の設定",
        "settings.storage_label": "お気に入り・履歴データの保存先",
        "settings.storage_change": "変更...",
        "settings.storage_hint": "※お気に入りや閲覧履歴などの情報は、このフォルダ内に保存されます。",
        "settings.cache_title": "サムネイルキャッシュ",
        "settings.cache_size_label": "現在のキャッシュサイズ",
        "settings.cache_clear_button": "キャッシュをクリア",
        "settings.cache_clear_confirm": "キャッシュをクリアしてもいいですか？",
        "settings.cache_size_loading": "計算中...",
      };
      return translations[key] || key;
    },
  }),
}));

describe("StorageSettings component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    dataStoragePath: "C:/Users/test/AppData/Roaming/image-viewer",
    onChangeStoragePath: vi.fn(),
  };

  it("fetches and displays the current cache size", async () => {
    // 5 MB = 5242880 bytes
    (invoke as any).mockImplementation((cmd: string) => {
      if (cmd === "get_thumbnail_cache_size") return Promise.resolve(5242880);
      return Promise.resolve();
    });

    render(<StorageSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("5.00 MB")).toBeInTheDocument();
    });

    expect(screen.getByText("サムネイルキャッシュ")).toBeInTheDocument();
    expect(screen.getByText("現在のキャッシュサイズ:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "キャッシュをクリア" })).toBeInTheDocument();
  });

  it("prompts confirmation and clears cache when user clicks OK", async () => {
    let currentCacheSize = 10485760; // 10 MB initially
    (invoke as any).mockImplementation((cmd: string) => {
      if (cmd === "get_thumbnail_cache_size") return Promise.resolve(currentCacheSize);
      if (cmd === "clear_thumbnail_cache") {
        currentCacheSize = 0;
        return Promise.resolve(50);
      }
      return Promise.resolve();
    });
    (confirm as any).mockResolvedValue(true);

    render(<StorageSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("10.00 MB")).toBeInTheDocument();
    });

    const clearButton = screen.getByRole("button", { name: "キャッシュをクリア" });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(confirm).toHaveBeenCalledWith(
        "キャッシュをクリアしてもいいですか？",
        expect.objectContaining({
          title: "サムネイルキャッシュ",
          kind: "warning",
        })
      );
    });

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("clear_thumbnail_cache");
      expect(screen.getByText("0 B")).toBeInTheDocument();
    });
  });

  it("does not clear cache when user cancels confirmation dialog", async () => {
    (invoke as any).mockImplementation((cmd: string) => {
      if (cmd === "get_thumbnail_cache_size") return Promise.resolve(5242880);
      return Promise.resolve();
    });
    (confirm as any).mockResolvedValue(false);

    render(<StorageSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("5.00 MB")).toBeInTheDocument();
    });

    const clearButton = screen.getByRole("button", { name: "キャッシュをクリア" });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(confirm).toHaveBeenCalled();
    });

    expect(invoke).not.toHaveBeenCalledWith("clear_thumbnail_cache");
  });
});
