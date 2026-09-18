import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SettingSection, SettingRow } from "../../components/settings/primitives";

describe("SettingSection", () => {
  it("タイトル、説明文、子要素が正しく描画されること", () => {
    render(
      <SettingSection title="表示設定" description="画面表示に関する設定">
        <div data-testid="child-item">項目1</div>
      </SettingSection>
    );

    expect(screen.getByText("表示設定")).toBeInTheDocument();
    expect(screen.getByText("画面表示に関する設定")).toBeInTheDocument();
    expect(screen.getByTestId("child-item")).toBeInTheDocument();
  });
});

describe("SettingRow", () => {
  it("ラベルとコントロールが描画され、verticalレイアウトが適用されること", () => {
    const { container } = render(
      <SettingRow label="項目ラベル" description="説明文" layout="vertical">
        <input type="text" data-testid="inner-input" />
      </SettingRow>
    );

    expect(screen.getByText("項目ラベル")).toBeInTheDocument();
    expect(screen.getByText("説明文")).toBeInTheDocument();
    expect(container.querySelector(".setting-row.layout-vertical")).toBeInTheDocument();
  });

  it("htmlForが渡された場合にlabelタグが関連付けられること", () => {
    render(
      <SettingRow label="スイッチ項目" htmlFor="my-switch-id">
        <input id="my-switch-id" type="checkbox" />
      </SettingRow>
    );

    const label = screen.getByText("スイッチ項目");
    expect(label.tagName).toBe("LABEL");
    expect(label).toHaveAttribute("for", "my-switch-id");
  });
});
