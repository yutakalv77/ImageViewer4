import { describe, it, expect, vi } from "vitest";
import {
  buildWindowMenuItems,
  isTargetInputOrTextarea,
  WindowMenuActionOptions,
} from "../utils/windowMenuUtils";

describe("windowMenuUtils", () => {
  const mockT = (key: string) => key;

  const createDefaultOptions = (isMaximized = false): WindowMenuActionOptions => ({
    isMaximized,
    t: mockT,
    onRestore: vi.fn(),
    onMove: vi.fn(),
    onSize: vi.fn(),
    onMinimize: vi.fn(),
    onMaximize: vi.fn(),
    onClose: vi.fn(),
  });

  describe("buildWindowMenuItems", () => {
    it("通常表示時（isMaximized: false）のメニュー状態とアクションが正しいこと", () => {
      const options = createDefaultOptions(false);
      const items = buildWindowMenuItems(options);

      expect(items).toHaveLength(7); // 6 items + 1 separator

      const [restore, move, size, minimize, maximize, separator, close] = items;

      // 元に戻す: 無効
      expect(restore.label).toBe("window_menu.restore");
      expect(restore.disabled).toBe(true);

      // 移動: 有効
      expect(move.label).toBe("window_menu.move");
      expect(move.disabled).toBe(false);

      // サイズ変更: 有効
      expect(size.label).toBe("window_menu.size");
      expect(size.disabled).toBe(false);

      // 最小化: 有効
      expect(minimize.label).toBe("window_menu.minimize");
      expect(minimize.disabled).toBe(false);

      // 最大化: 有効
      expect(maximize.label).toBe("window_menu.maximize");
      expect(maximize.disabled).toBe(false);

      // セパレーター
      expect(separator.separator).toBe(true);

      // 閉じる: 有効 + ショートカット
      expect(close.label).toBe("window_menu.close");
      expect(close.disabled).toBe(false);
      expect(close.shortcut).toBe("Alt+F4");

      // 各クリックアクションの発火検証
      move.onClick?.();
      expect(options.onMove).toHaveBeenCalledTimes(1);

      size.onClick?.();
      expect(options.onSize).toHaveBeenCalledTimes(1);

      minimize.onClick?.();
      expect(options.onMinimize).toHaveBeenCalledTimes(1);

      maximize.onClick?.();
      expect(options.onMaximize).toHaveBeenCalledTimes(1);

      close.onClick?.();
      expect(options.onClose).toHaveBeenCalledTimes(1);
    });

    it("最大化時（isMaximized: true）のメニュー状態が正しいこと", () => {
      const options = createDefaultOptions(true);
      const items = buildWindowMenuItems(options);

      const [restore, move, size, minimize, maximize, , close] = items;

      // 元に戻す: 有効
      expect(restore.disabled).toBe(false);
      restore.onClick?.();
      expect(options.onRestore).toHaveBeenCalledTimes(1);

      // 移動: 無効
      expect(move.disabled).toBe(true);

      // サイズ変更: 無効
      expect(size.disabled).toBe(true);

      // 最小化: 有効
      expect(minimize.disabled).toBe(false);

      // 最大化: 無効
      expect(maximize.disabled).toBe(true);

      // 閉じる: 有効
      expect(close.disabled).toBe(false);
    });
  });

  describe("isTargetInputOrTextarea", () => {
    it("input要素とtextarea要素を正しく識別すること", () => {
      const input = document.createElement("input");
      const textarea = document.createElement("textarea");
      const div = document.createElement("div");
      const button = document.createElement("button");

      expect(isTargetInputOrTextarea(input)).toBe(true);
      expect(isTargetInputOrTextarea(textarea)).toBe(true);
      expect(isTargetInputOrTextarea(div)).toBe(false);
      expect(isTargetInputOrTextarea(button)).toBe(false);
      expect(isTargetInputOrTextarea(null)).toBe(false);
    });
  });
});
