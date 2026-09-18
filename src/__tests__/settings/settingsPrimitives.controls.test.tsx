import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  SettingToggle,
  SettingSelect,
  SettingPathInput,
  SettingSlider,
  SettingNumberInput,
} from "../../components/settings/primitives";

describe("SettingToggle", () => {
  it("トグルのクリックおよびキーボード操作でonChangeが呼ばれること", () => {
    const handleChange = vi.fn();
    render(
      <SettingToggle
        label="ダークモード"
        checked={false}
        onChange={handleChange}
      />
    );

    const toggleBtn = screen.getByRole("switch", { name: "ダークモード" });
    expect(toggleBtn).toHaveAttribute("aria-checked", "false");

    // クリック操作
    fireEvent.click(toggleBtn);
    expect(handleChange).toHaveBeenCalledWith(true);

    // キーボード操作 (Space)
    fireEvent.keyDown(toggleBtn, { key: " " });
    expect(handleChange).toHaveBeenCalledWith(true);

    // キーボード操作 (Enter)
    fireEvent.keyDown(toggleBtn, { key: "Enter" });
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("disabled時はクリックしてもonChangeが呼ばれないこと", () => {
    const handleChange = vi.fn();
    render(
      <SettingToggle
        label="無効な設定"
        checked={true}
        onChange={handleChange}
        disabled={true}
      />
    );

    const toggleBtn = screen.getByRole("switch", { name: "無効な設定" });
    expect(toggleBtn).toBeDisabled();

    fireEvent.click(toggleBtn);
    expect(handleChange).not.toHaveBeenCalled();
  });
});

describe("SettingSelect", () => {
  const options = [
    { value: "light", label: "ライト" },
    { value: "dark", label: "ダーク" },
  ];

  it("文字列選択の変更時にonChangeが正しく呼ばれること", () => {
    const handleChange = vi.fn();
    render(
      <SettingSelect
        label="テーマ"
        value="light"
        options={options}
        onChange={handleChange}
      />
    );

    const select = screen.getByRole("combobox", { name: "テーマ" });
    expect(select).toHaveValue("light");

    fireEvent.change(select, { target: { value: "dark" } });
    expect(handleChange).toHaveBeenCalledWith("dark");
  });

  it("数値型の選択肢で正しくnumber型の値がonChangeに渡ること", () => {
    const handleChange = vi.fn();
    const numOptions = [
      { value: 10, label: "10秒" },
      { value: 30, label: "30秒" },
    ];
    render(
      <SettingSelect
        label="間隔"
        value={10}
        options={numOptions}
        onChange={handleChange}
      />
    );

    const select = screen.getByRole("combobox", { name: "間隔" });
    fireEvent.change(select, { target: { value: "30" } });
    expect(handleChange).toHaveBeenCalledWith(30);
  });
});

describe("SettingPathInput", () => {
  it("パス表示、参照、リセットボタンが正しく機能すること", () => {
    const handleBrowse = vi.fn();
    const handleReset = vi.fn();

    render(
      <SettingPathInput
        label="保存先フォルダ"
        value="C:/Images"
        onBrowse={handleBrowse}
        onReset={handleReset}
      />
    );

    expect(screen.getByDisplayValue("C:/Images")).toBeInTheDocument();

    const browseBtn = screen.getByRole("button", { name: "参照..." });
    fireEvent.click(browseBtn);
    expect(handleBrowse).toHaveBeenCalledTimes(1);

    const resetBtn = screen.getByRole("button", { name: "リセット" });
    fireEvent.click(resetBtn);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  it("onResetが指定されていない場合はリセットボタンが表示されないこと", () => {
    render(
      <SettingPathInput
        label="背景画像"
        placeholder="画像が選択されていません"
        onBrowse={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText("画像が選択されていません")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "リセット" })).not.toBeInTheDocument();
  });

  it("値が空の時はリセットボタンが非活性（disabled）になること", () => {
    render(
      <SettingPathInput
        label="背景画像"
        value=""
        onBrowse={vi.fn()}
        onReset={vi.fn()}
      />
    );

    const resetBtn = screen.getByRole("button", { name: "リセット" });
    expect(resetBtn).toBeDisabled();
  });
});

describe("SettingSlider", () => {
  it("スライダー値の変更とカスタムフォーマットが機能すること", () => {
    const handleChange = vi.fn();
    render(
      <SettingSlider
        label="不透明度"
        value={50}
        min={0}
        max={100}
        onChange={handleChange}
        formatValue={(v) => `${v}%`}
      />
    );

    expect(screen.getByText("50%")).toBeInTheDocument();

    const slider = screen.getByRole("slider", { name: "不透明度" });
    fireEvent.change(slider, { target: { value: "75" } });
    expect(handleChange).toHaveBeenCalledWith(75);
  });
});

describe("SettingNumberInput", () => {
  it("数値入力の変更と単位表示が機能すること", () => {
    const handleChange = vi.fn();
    render(
      <SettingNumberInput
        label="ぼかし強度"
        value={10}
        min={0}
        max={50}
        unit="px"
        onChange={handleChange}
      />
    );

    expect(screen.getByText("px")).toBeInTheDocument();

    const spin = screen.getByRole("spinbutton", { name: "ぼかし強度" });
    fireEvent.change(spin, { target: { value: "20" } });
    expect(handleChange).toHaveBeenCalledWith(20);
  });

  it("小数の入力変更や不正な入力時の0フォールバックが機能すること", () => {
    const handleChange = vi.fn();
    render(
      <SettingNumberInput
        label="スケール"
        value={1.0}
        step={0.1}
        onChange={handleChange}
      />
    );

    const spin = screen.getByRole("spinbutton", { name: "スケール" });
    fireEvent.change(spin, { target: { value: "1.5" } });
    expect(handleChange).toHaveBeenCalledWith(1.5);

    fireEvent.change(spin, { target: { value: "" } });
    expect(handleChange).toHaveBeenCalledWith(0);
  });
});
