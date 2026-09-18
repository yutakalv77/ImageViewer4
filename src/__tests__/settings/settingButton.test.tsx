import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingButton } from "../../components/settings/primitives/SettingButton";

describe("SettingButton Component", () => {
  it("デフォルトバリアントでボタンが描画されること", () => {
    render(<SettingButton>テストボタン</SettingButton>);

    const btn = screen.getByRole("button", { name: "テストボタン" });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass("settings-button");
    expect(btn).not.toHaveClass("primary");
    expect(btn).not.toHaveClass("danger");
  });

  it("primaryバリアントのクラスが付与されること", () => {
    render(<SettingButton variant="primary">保存</SettingButton>);

    const btn = screen.getByRole("button", { name: "保存" });
    expect(btn).toHaveClass("settings-button");
    expect(btn).toHaveClass("primary");
  });

  it("dangerバリアントのクラスが付与されること", () => {
    render(<SettingButton variant="danger">削除</SettingButton>);

    const btn = screen.getByRole("button", { name: "削除" });
    expect(btn).toHaveClass("settings-button");
    expect(btn).toHaveClass("danger");
  });

  it("クリックイベントが正しく発火すること", () => {
    const handleClick = vi.fn();
    render(<SettingButton onClick={handleClick}>クリック</SettingButton>);

    fireEvent.click(screen.getByRole("button", { name: "クリック" }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("disabled時にクリックイベントが発火しないこと", () => {
    const handleClick = vi.fn();
    render(<SettingButton disabled onClick={handleClick}>無効</SettingButton>);

    const btn = screen.getByRole("button", { name: "無効" });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
