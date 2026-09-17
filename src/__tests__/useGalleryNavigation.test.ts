import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGalleryNavigation } from "../hooks/useGalleryNavigation";
import { EntryItem } from "../types";

describe("useGalleryNavigation hook", () => {
  const dummyEntries: EntryItem[] = [
    { name: "item1.jpg", path: "/path/item1.jpg", is_dir: false, thumbnail_path: null },
    { name: "item2.jpg", path: "/path/item2.jpg", is_dir: false, thumbnail_path: null },
    { name: "item3.jpg", path: "/path/item3.jpg", is_dir: false, thumbnail_path: null },
  ];

  it("ArrowRightで次のアイテムを選択すること", () => {
    const onEntryClick = vi.fn();
    const { result } = renderHook(() =>
      useGalleryNavigation(dummyEntries, onEntryClick, { columns: 3 })
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    });

    expect(result.current.selectedIndex).toBe(0);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    });

    expect(result.current.selectedIndex).toBe(1);
  });

  it("F2キー押下で現在選択中のアイテムがeditingIndexになること", () => {
    const onEntryClick = vi.fn();
    const { result } = renderHook(() =>
      useGalleryNavigation(dummyEntries, onEntryClick, { columns: 3 })
    );

    // まず2番目のアイテムを選択
    act(() => {
      result.current.setSelectedIndex(1);
    });

    // F2キーを押下
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "F2" }));
    });

    expect(result.current.editingIndex).toBe(1);
  });

  it("未選択状態でF2キーを押下すると先頭アイテム（0）がeditingIndexになること", () => {
    const onEntryClick = vi.fn();
    const { result } = renderHook(() =>
      useGalleryNavigation(dummyEntries, onEntryClick, { columns: 3 })
    );

    expect(result.current.selectedIndex).toBe(-1);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "F2" }));
    });

    expect(result.current.selectedIndex).toBe(0);
    expect(result.current.editingIndex).toBe(0);
  });

  it("Enterキーで onEntryClick が呼ばれること", () => {
    const onEntryClick = vi.fn();
    const { result } = renderHook(() =>
      useGalleryNavigation(dummyEntries, onEntryClick, { columns: 3 })
    );

    act(() => {
      result.current.setSelectedIndex(2);
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    });

    expect(onEntryClick).toHaveBeenCalledWith(dummyEntries[2]);
  });

  it("input要素フォーカス時（e.targetがINPUT）はEnterキーを押しても onEntryClick が呼ばれないこと", () => {
    const onEntryClick = vi.fn();
    const { result } = renderHook(() =>
      useGalleryNavigation(dummyEntries, onEntryClick, { columns: 3 })
    );

    act(() => {
      result.current.setSelectedIndex(1);
    });

    const input = document.createElement("input");
    document.body.appendChild(input);

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
      input.dispatchEvent(event);
    });

    expect(onEntryClick).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("編集モード（editingIndex !== -1）の時はEnterキーを押しても onEntryClick が呼ばれないこと", () => {
    const onEntryClick = vi.fn();
    const { result } = renderHook(() =>
      useGalleryNavigation(dummyEntries, onEntryClick, { columns: 3 })
    );

    act(() => {
      result.current.setSelectedIndex(1);
      result.current.setEditingIndex(1);
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    });

    expect(onEntryClick).not.toHaveBeenCalled();
  });
});
