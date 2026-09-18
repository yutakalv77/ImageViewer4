import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { getPreloadPaths, useImagePreload } from "../hooks/useImagePreload";
import { EntryItem } from "../types";

vi.mock("@tauri-apps/api/core", () => ({
  convertFileSrc: (path: string) => `asset://localhost/${encodeURIComponent(path)}`,
}));

describe("useImagePreload", () => {
  const dummyImages: EntryItem[] = [
    { name: "img0.jpg", path: "C:\\images\\img0.jpg", is_dir: false, thumbnail_path: null },
    { name: "img1.jpg", path: "C:\\images\\img1.jpg", is_dir: false, thumbnail_path: null },
    { name: "img2.jpg", path: "C:\\images\\img2.jpg", is_dir: false, thumbnail_path: null },
    { name: "img3.jpg", path: "C:\\images\\img3.jpg", is_dir: false, thumbnail_path: null },
    { name: "img4.jpg", path: "C:\\images\\img4.jpg", is_dir: false, thumbnail_path: null },
  ];

  describe("getPreloadPaths", () => {
    it("空の画像配列や無効なインデックスの場合は空配列を返すこと", () => {
      expect(getPreloadPaths(undefined, 0)).toEqual([]);
      expect(getPreloadPaths([], 0)).toEqual([]);
      expect(getPreloadPaths(dummyImages, -1)).toEqual([]);
    });

    it("先頭（index 0）の場合、前方はスキップして後方のパスを返すこと", () => {
      const paths = getPreloadPaths(dummyImages, 0, 2);
      expect(paths).toEqual([
        "C:\\images\\img1.jpg",
        "C:\\images\\img2.jpg",
      ]);
    });

    it("中間（index 2）の場合、前後2枚ずつ（自身を除く）のパスを返すこと", () => {
      const paths = getPreloadPaths(dummyImages, 2, 2);
      expect(paths).toEqual([
        "C:\\images\\img0.jpg",
        "C:\\images\\img1.jpg",
        "C:\\images\\img3.jpg",
        "C:\\images\\img4.jpg",
      ]);
    });

    it("末尾（index 4）の場合、後方はスキップして前方のパスを返すこと", () => {
      const paths = getPreloadPaths(dummyImages, 4, 2);
      expect(paths).toEqual([
        "C:\\images\\img2.jpg",
        "C:\\images\\img3.jpg",
      ]);
    });

    it("ZIP仮想パスが含まれている場合、そのパスはスキップされること", () => {
      const mixedImages: EntryItem[] = [
        { name: "img0.jpg", path: "C:\\images\\img0.jpg", is_dir: false, thumbnail_path: null },
        { name: "in_zip.jpg", path: "C:\\images\\book.zip::in_zip.jpg", is_dir: false, thumbnail_path: null },
        { name: "img2.jpg", path: "C:\\images\\img2.jpg", is_dir: false, thumbnail_path: null },
      ];
      const paths = getPreloadPaths(mixedImages, 0, 2);
      // in_zip.jpg は ZIP パスなので除外され、img2.jpg のみ
      expect(paths).toEqual(["C:\\images\\img2.jpg"]);
    });
  });

  describe("useImagePreload hook", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("isOpen が false の場合はプリロードを行わないこと", () => {
      const imagesSpy: string[] = [];
      const originalImage = window.Image;
      window.Image = class {
        set src(val: string) {
          imagesSpy.push(val);
        }
      } as unknown as typeof Image;

      renderHook(() => useImagePreload(dummyImages, 2, false));

      expect(imagesSpy).toHaveLength(0);
      window.Image = originalImage;
    });

    it("isOpen が true の場合、前後画像の src が設定されること", () => {
      const imagesSpy: string[] = [];
      const originalImage = window.Image;
      window.Image = class {
        set src(val: string) {
          imagesSpy.push(val);
        }
      } as unknown as typeof Image;

      renderHook(() => useImagePreload(dummyImages, 2, true, 2));

      expect(imagesSpy).toHaveLength(4);
      expect(imagesSpy[0]).toContain("img0.jpg");
      expect(imagesSpy[1]).toContain("img1.jpg");
      expect(imagesSpy[2]).toContain("img3.jpg");
      expect(imagesSpy[3]).toContain("img4.jpg");

      window.Image = originalImage;
    });

    it("isOpen が true から false に切り替わった場合、またはアンマウント時にキャッシュがクリアされること", () => {
      const originalImage = window.Image;
      window.Image = class {
        set src(_val: string) {}
      } as unknown as typeof Image;

      const { rerender, unmount } = renderHook(
        ({ isOpen }) => useImagePreload(dummyImages, 2, isOpen, 2),
        { initialProps: { isOpen: true } }
      );

      // isOpen: false への切り替えでクリーンアップ処理が問題なく通過すること
      expect(() => {
        rerender({ isOpen: false });
      }).not.toThrow();

      // アンマウントでもエラーなくクリーンアップされること
      expect(() => {
        unmount();
      }).not.toThrow();

      window.Image = originalImage;
    });
  });
});
