import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModalWindow } from "../../components/ModalWindow";

describe("ModalWindow", () => {
  it("isOpenがfalseの時は何も描画されないこと", () => {
    const { container } = render(
      <ModalWindow isOpen={false} onClose={vi.fn()} title="テストウィンドウ">
        <div>コンテンツ</div>
      </ModalWindow>
    );
    expect(container.firstChild).toBeNull();
  });

  it("isOpenがtrueの時、タイトル、コンテンツ、フッター、リサイズハンドルが描画されること", () => {
    const { container } = render(
      <ModalWindow
        isOpen={true}
        onClose={vi.fn()}
        title="テストウィンドウ"
        footer={<button>OK</button>}
      >
        <div>ウィンドウの中身</div>
      </ModalWindow>
    );

    expect(screen.getByText("テストウィンドウ")).toBeInTheDocument();
    expect(screen.getByText("ウィンドウの中身")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument();

    expect(container.querySelector(".window-title-bar")).toBeInTheDocument();
    expect(container.querySelector(".win-resize-handle.e")).toBeInTheDocument();
    expect(container.querySelector(".win-resize-handle.s")).toBeInTheDocument();
    expect(container.querySelector(".win-resize-handle.se")).toBeInTheDocument();
  });

  it("閉じるボタンをクリックした時にonCloseが呼ばれること", () => {
    const handleClose = vi.fn();
    render(
      <ModalWindow isOpen={true} onClose={handleClose} title="テストウィンドウ">
        <div>コンテンツ</div>
      </ModalWindow>
    );

    const closeBtn = screen.getByRole("button", { name: "Close" });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("追加のclassNameが正しく適用されること", () => {
    const { container } = render(
      <ModalWindow
        isOpen={true}
        onClose={vi.fn()}
        title="テストウィンドウ"
        className="custom-window-class"
      >
        <div>コンテンツ</div>
      </ModalWindow>
    );

    const modal = container.querySelector(".settings-modal");
    expect(modal).toHaveClass("custom-window-class");
  });
});
