import { describe, it, expect } from "vitest";
import {
  toggleSearchScope,
  determineSearchScope,
  getSearchPlaceholder,
  getSearchScopeTooltip,
} from "../../utils/searchUtils";

describe("searchUtils", () => {
  describe("toggleSearchScope", () => {
    it("folder から everything へトグルすること", () => {
      expect(toggleSearchScope("folder")).toBe("everything");
    });

    it("everything から folder へトグルすること", () => {
      expect(toggleSearchScope("everything")).toBe("folder");
    });
  });

  describe("determineSearchScope", () => {
    it("Shiftキーが押されていない場合、activeScope がそのまま返ること", () => {
      expect(determineSearchScope({ isShiftKey: false, activeScope: "folder" })).toBe("folder");
      expect(determineSearchScope({ isShiftKey: false, activeScope: "everything" })).toBe("everything");
    });

    it("Shiftキーが押されている場合、逆のスコープが返ること", () => {
      expect(determineSearchScope({ isShiftKey: true, activeScope: "folder" })).toBe("everything");
      expect(determineSearchScope({ isShiftKey: true, activeScope: "everything" })).toBe("folder");
    });
  });

  describe("getSearchPlaceholder", () => {
    const mockT = (key: string, opts?: any) => opts?.defaultValue || key;

    it("Everythingが無効の場合、通常の検索プレースホルダーを返すこと", () => {
      const placeholder = getSearchPlaceholder("folder", false, mockT);
      expect(placeholder).toBe("検索...");
    });

    it("Everythingが有効かつfolderスコープの場合、Shift+Enterで全体の案内を含むこと", () => {
      const placeholder = getSearchPlaceholder("folder", true, mockT);
      expect(placeholder).toBe("フォルダ内を検索... (Shift+Enterで全体)");
    });

    it("Everythingが有効かつeverythingスコープの場合、Shift+Enterでフォルダ内の案内を含むこと", () => {
      const placeholder = getSearchPlaceholder("everything", true, mockT);
      expect(placeholder).toBe("Everything全体検索... (Shift+Enterでフォルダ内)");
    });
  });

  describe("getSearchScopeTooltip", () => {
    const mockT = (key: string, opts?: any) => opts?.defaultValue || key;

    it("folderスコープの適切なツールチップを返すこと", () => {
      const tooltip = getSearchScopeTooltip("folder", mockT);
      expect(tooltip).toBe("現在のフォルダ内を検索中（クリックでEverything全体検索に切替）");
    });

    it("everythingスコープの適切なツールチップを返すこと", () => {
      const tooltip = getSearchScopeTooltip("everything", mockT);
      expect(tooltip).toBe("Everythingで全体検索中（クリックでフォルダ内検索に切替）");
    });
  });
});
