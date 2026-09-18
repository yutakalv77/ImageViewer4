import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EverythingSettings } from "../../components/settings/EverythingSettings";

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
  const defaultProps = {
    everythingEnabled: true,
    everythingMaxResults: 100,
    everythingCliPath: "C:/tools/es.exe",
    isRunning: true,
    onUpdateEnabled: vi.fn(),
    onUpdateMaxResults: vi.fn(),
    onUpdateCliPath: vi.fn(),
    onPickCliPath: vi.fn(),
  };

  it("タイトル、サービス状態、各設定項目が正しく描画されること", () => {
    render(<EverythingSettings {...defaultProps} />);

    expect(screen.getByText("Everything 検索連携")).toBeInTheDocument();
    expect(screen.getByText("サービス状態")).toBeInTheDocument();
    expect(screen.getByText("実行中")).toBeInTheDocument();

    const toggle = screen.getByRole("switch", { name: "Everything検索を有効にする" });
    expect(toggle).toHaveAttribute("aria-checked", "true");

    const limitInput = screen.getByRole("spinbutton", { name: "最大取得件数" });
    expect(limitInput).toHaveValue(100);

    expect(screen.getByDisplayValue("C:/tools/es.exe")).toBeInTheDocument();
  });

  it("isRunningがfalseの場合は停止中が表示されること", () => {
    render(<EverythingSettings {...defaultProps} isRunning={false} />);
    expect(screen.getByText("停止中")).toBeInTheDocument();
  });

  it("トグル操作でonUpdateEnabledが呼ばれること", () => {
    const handleUpdateEnabled = vi.fn();
    render(<EverythingSettings {...defaultProps} onUpdateEnabled={handleUpdateEnabled} />);

    const toggle = screen.getByRole("switch", { name: "Everything検索を有効にする" });
    fireEvent.click(toggle);

    expect(handleUpdateEnabled).toHaveBeenCalledWith(false);
  });

  it("最大取得件数を変更したときにonUpdateMaxResultsが呼ばれること", () => {
    const handleUpdateMaxResults = vi.fn();
    render(<EverythingSettings {...defaultProps} onUpdateMaxResults={handleUpdateMaxResults} />);

    const limitInput = screen.getByRole("spinbutton", { name: "最大取得件数" });
    fireEvent.change(limitInput, { target: { value: "200" } });

    expect(handleUpdateMaxResults).toHaveBeenCalledWith(200);
  });

  it("参照ボタンをクリックしたときにonPickCliPathが呼ばれること", () => {
    const handlePickCli = vi.fn();
    render(<EverythingSettings {...defaultProps} onPickCliPath={handlePickCli} />);

    const browseBtn = screen.getByRole("button", { name: "参照..." });
    fireEvent.click(browseBtn);

    expect(handlePickCli).toHaveBeenCalledTimes(1);
  });

  it("リセットボタンをクリックしたときにonUpdateCliPathが空文字で呼ばれること", () => {
    const handleUpdateCliPath = vi.fn();
    render(<EverythingSettings {...defaultProps} onUpdateCliPath={handleUpdateCliPath} />);

    const resetBtn = screen.getByRole("button", { name: "リセット" });
    fireEvent.click(resetBtn);

    expect(handleUpdateCliPath).toHaveBeenCalledWith("");
  });
});
