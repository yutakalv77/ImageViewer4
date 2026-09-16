import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ContextMenu } from "../components/ContextMenu";
import { ContextMenuItem } from "../utils/windowMenuUtils";

describe("ContextMenu component", () => {
  it("メニュー項目、セパレーター、ショートカットが正しく描画されること", () => {
    const onClose = vi.fn();
    const items: ContextMenuItem[] = [
      { label: "Item 1", onClick: vi.fn() },
      { separator: true },
      { label: "Item 2", disabled: true, shortcut: "Ctrl+C", onClick: vi.fn() },
    ];

    render(<ContextMenu x={100} y={100} onClose={onClose} items={items} />);

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Ctrl+C")).toBeInTheDocument();
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("有効な項目をクリックした際に onClick と onClose が呼ばれること", () => {
    const onClose = vi.fn();
    const onClick = vi.fn();
    const items: ContextMenuItem[] = [{ label: "Clickable", onClick }];

    render(<ContextMenu x={50} y={50} onClose={onClose} items={items} />);

    fireEvent.click(screen.getByText("Clickable"));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("無効（disabled）な項目をクリックしても onClick や onClose が呼ばれないこと", () => {
    const onClose = vi.fn();
    const onClick = vi.fn();
    const items: ContextMenuItem[] = [{ label: "Disabled Item", disabled: true, onClick }];

    render(<ContextMenu x={50} y={50} onClose={onClose} items={items} />);

    const itemEl = screen.getByText("Disabled Item");
    fireEvent.click(itemEl);

    expect(onClick).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("メニュー外のクリックで onClose が呼ばれること", () => {
    const onClose = vi.fn();
    const items: ContextMenuItem[] = [{ label: "Item", onClick: vi.fn() }];

    render(
      <div>
        <div data-testid="outside">Outside Area</div>
        <ContextMenu x={50} y={50} onClose={onClose} items={items} />
      </div>
    );

    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Escape キー押下で onClose が呼ばれること", () => {
    const onClose = vi.fn();
    const items: ContextMenuItem[] = [{ label: "Item", onClick: vi.fn() }];

    render(<ContextMenu x={50} y={50} onClose={onClose} items={items} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
