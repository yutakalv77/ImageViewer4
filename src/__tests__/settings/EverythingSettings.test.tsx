import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EverythingSettings } from "../../components/settings/EverythingSettings";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "settings.everything_title": "Everything 検索連携",
        "settings.everything_desc": "高速なファイル検索エンジン「Everything」と連携してフォルダ内を高速検索します。",
        "settings.everything_status": "サービス状態",
        "settings.everything_status_running": "実行中",
        "settings.everything_status_stopped": "停止中",
        "settings.everything_enable": "Everything検索を有効にする",
        "settings.everything_limit": "最大取得件数",
        "settings.everything_cli_label": "CLIツール（es.exe）のパス",
        "settings.everything_cli_hint": "※通常は自動検出されますが、見つからない場合は手動で設定してください。",
        "settings.everything_cli_placeholder": "es.exe への絶対パス",
        "settings.storage_change": "参照...",
        "common.reset": "リセット",
      };
      return map[key] || key;
    },
  }),
}));

describe("EverythingSettings Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (invoke as any).mockResolvedValue(true);
  });

  const defaultProps = {
    everythingEnabled: true,
    everythingMaxResults: 100,
    everythingCliPath: "C:/tools/es.exe",
    onUpdateEnabled: vi.fn(),
    onUpdateMaxResults: vi.fn(),
    onUpdateCliPath: vi.fn(),
  };

  it("タイトル、サービス状態、各設定項目が正しく描画されること", async () => {
    render(<EverythingSettings {...defaultProps} />);

    expect(screen.getByText("Everything 検索連携")).toBeInTheDocument();
    expect(screen.getByText("サービス状態")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("実行中")).toBeInTheDocument();
    });

    const toggle = screen.getByRole("switch", { name: "Everything検索を有効にする" });
    expect(toggle).toHaveAttribute("aria-checked", "true");

    const limitInput = screen.getByRole("spinbutton", { name: "最大取得件数" });
    expect(limitInput).toHaveValue(100);

    expect(screen.getByDisplayValue("C:/tools/es.exe")).toBeInTheDocument();
  });

  it("トグル操作でonUpdateEnabledが呼ばれること", async () => {
    const handleUpdateEnabled = vi.fn();
    render(<EverythingSettings {...defaultProps} onUpdateEnabled={handleUpdateEnabled} />);

    await waitFor(() => {
      expect(screen.getByText("実行中")).toBeInTheDocument();
    });

    const toggle = screen.getByRole("switch", { name: "Everything検索を有効にする" });
    fireEvent.click(toggle);

    expect(handleUpdateEnabled).toHaveBeenCalledWith(false);
  });

  it("最大取得件数を変更したときにonUpdateMaxResultsが呼ばれること", async () => {
    const handleUpdateMaxResults = vi.fn();
    render(<EverythingSettings {...defaultProps} onUpdateMaxResults={handleUpdateMaxResults} />);

    await waitFor(() => {
      expect(screen.getByText("実行中")).toBeInTheDocument();
    });

    const limitInput = screen.getByRole("spinbutton", { name: "最大取得件数" });
    fireEvent.change(limitInput, { target: { value: "200" } });

    expect(handleUpdateMaxResults).toHaveBeenCalledWith(200);
  });

  it("参照ボタンをクリックしてファイルを選択したときにonUpdateCliPathが呼ばれること", async () => {
    const handleUpdateCliPath = vi.fn();
    (open as any).mockResolvedValue("D:/apps/es.exe");

    render(<EverythingSettings {...defaultProps} onUpdateCliPath={handleUpdateCliPath} />);

    await waitFor(() => {
      expect(screen.getByText("実行中")).toBeInTheDocument();
    });

    const browseBtn = screen.getByRole("button", { name: "参照..." });
    fireEvent.click(browseBtn);

    await waitFor(() => {
      expect(open).toHaveBeenCalled();
      expect(handleUpdateCliPath).toHaveBeenCalledWith("D:/apps/es.exe");
    });
  });

  it("リセットボタンをクリックしたときにonUpdateCliPathが空文字で呼ばれること", async () => {
    const handleUpdateCliPath = vi.fn();
    render(<EverythingSettings {...defaultProps} onUpdateCliPath={handleUpdateCliPath} />);

    await waitFor(() => {
      expect(screen.getByText("実行中")).toBeInTheDocument();
    });

    const resetBtn = screen.getByRole("button", { name: "リセット" });
    fireEvent.click(resetBtn);

    expect(handleUpdateCliPath).toHaveBeenCalledWith("");
  });
});
