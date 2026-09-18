import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HistorySettings } from "../../components/settings/HistorySettings";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "settings.history_title": "閲覧履歴の設定",
        "settings.history_label": "履歴の保存期間（日数）",
        "settings.history_hint": "※指定した日数を超えた閲覧履歴は自動的に削除されます。0を指定すると無期限に保存します。",
      };
      return map[key] || key;
    },
  }),
}));

describe("HistorySettings Component", () => {
  it("タイトル、ラベル、説明文、数値入力が正しく描画されること", () => {
    render(
      <HistorySettings
        historyRetentionDays={30}
        onUpdateHistoryRetention={vi.fn()}
      />
    );

    expect(screen.getByText("閲覧履歴の設定")).toBeInTheDocument();
    expect(screen.getByText("履歴の保存期間（日数）")).toBeInTheDocument();
    expect(screen.getByText(/指定した日数を超えた閲覧履歴は自動的に削除されます/)).toBeInTheDocument();

    const input = screen.getByRole("spinbutton", { name: "履歴の保存期間（日数）" });
    expect(input).toHaveValue(30);
  });

  it("数値を変更したときにonUpdateHistoryRetentionが正しく呼ばれること", () => {
    const handleUpdate = vi.fn();
    render(
      <HistorySettings
        historyRetentionDays={30}
        onUpdateHistoryRetention={handleUpdate}
      />
    );

    const input = screen.getByRole("spinbutton", { name: "履歴の保存期間（日数）" });
    fireEvent.change(input, { target: { value: "60" } });

    expect(handleUpdate).toHaveBeenCalledWith(60);
  });
});
