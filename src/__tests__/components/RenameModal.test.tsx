import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RenameModal } from "../../components/RenameModal";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => opts?.defaultValue || key,
  }),
}));

describe("RenameModal component", () => {
  it("isOpen が false の場合は何も描画しないこと", () => {
    const { container } = render(
      <RenameModal
        isOpen={false}
        currentName="test.jpg"
        onRename={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("開いた時に入力欄に現在の名前が表示されること", () => {
    render(
      <RenameModal
        isOpen={true}
        currentName="sample.png"
        onRename={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("sample.png");
  });

  it("名前を変更してOKボタンを押すと onRename が呼ばれること", async () => {
    const onRename = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <RenameModal
        isOpen={true}
        currentName="old_name.jpg"
        onRename={onRename}
        onClose={onClose}
      />
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "new_name.jpg" } });

    const okButton = screen.getByRole("button", { name: "OK" });
    fireEvent.click(okButton);

    await waitFor(() => {
      expect(onRename).toHaveBeenCalledWith("new_name.jpg");
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("Enterキーでリネームが実行されること", async () => {
    const onRename = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <RenameModal
        isOpen={true}
        currentName="old.jpg"
        onRename={onRename}
        onClose={onClose}
      />
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "renamed.jpg" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(onRename).toHaveBeenCalledWith("renamed.jpg");
    });
  });

  it("Escapeキーで onClose が呼ばれること", () => {
    const onClose = vi.fn();

    render(
      <RenameModal
        isOpen={true}
        currentName="test.jpg"
        onRename={vi.fn()}
        onClose={onClose}
      />
    );

    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onClose).toHaveBeenCalled();
  });

  it("無効な文字が含まれる場合はOKボタンが無効化されること", () => {
    render(
      <RenameModal
        isOpen={true}
        currentName="test.jpg"
        onRename={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "invalid/name.jpg" } });

    const okButton = screen.getByRole("button", { name: "OK" });
    expect(okButton).toBeDisabled();
  });
});
