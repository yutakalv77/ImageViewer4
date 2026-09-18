import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFileOperations } from "../../hooks/useFileOperations";
import { invoke } from "@tauri-apps/api/core";
import { message, confirm } from "@tauri-apps/plugin-dialog";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  message: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => {
      if (opts?.defaultValue) return opts.defaultValue;
      return key;
    },
  }),
}));

describe("useFileOperations", () => {
  const mockLoadDirectory = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("renameEntry", () => {
    it("正常にファイル名を変更しディレクトリを再読み込みすること", async () => {
      (invoke as any).mockResolvedValue(undefined);
      mockLoadDirectory.mockResolvedValue(undefined);

      const { result } = renderHook(() => useFileOperations(mockLoadDirectory));

      let newPath = "";
      await act(async () => {
        newPath = await result.current.renameEntry(
          "C:\\photos\\old.jpg",
          "new.jpg",
          "C:\\photos"
        );
      });

      expect(invoke).toHaveBeenCalledWith("rename_entry", {
        oldPath: "C:\\photos\\old.jpg",
        newPath: "C:\\photos\\new.jpg",
      });
      expect(mockLoadDirectory).toHaveBeenCalledWith("C:\\photos", true);
      expect(newPath).toBe("C:\\photos\\new.jpg");
    });

    it("無効なファイル名の場合にエラーダイアログを表示し例外を投げること", async () => {
      const { result } = renderHook(() => useFileOperations(mockLoadDirectory));

      await expect(
        result.current.renameEntry("C:\\photos\\old.jpg", "invalid/name.jpg", "C:\\photos")
      ).rejects.toThrow("Invalid file name");

      expect(message).toHaveBeenCalled();
      expect(invoke).not.toHaveBeenCalled();
    });
  });

  describe("trashEntry", () => {
    it("ZIP仮想パスの場合は削除せずfalseを返すこと", async () => {
      const { result } = renderHook(() => useFileOperations(mockLoadDirectory));

      let success = false;
      await act(async () => {
        success = await result.current.trashEntry(
          "C:\\archive.zip::image.jpg",
          "C:\\archive.zip"
        );
      });

      expect(success).toBe(false);
      expect(confirm).not.toHaveBeenCalled();
      expect(invoke).not.toHaveBeenCalled();
    });

    it("confirmDeleteが有効でユーザーが確認ダイアログでOKを押した場合、ごみ箱へ移動すること", async () => {
      (confirm as any).mockResolvedValue(true);
      (invoke as any).mockResolvedValue(undefined);
      mockLoadDirectory.mockResolvedValue(undefined);

      const { result } = renderHook(() => useFileOperations(mockLoadDirectory));

      let success = false;
      await act(async () => {
        success = await result.current.trashEntry(
          "C:\\photos\\target.jpg",
          "C:\\photos",
          { confirmDelete: true }
        );
      });

      expect(confirm).toHaveBeenCalledWith(
        expect.stringContaining("target.jpg"),
        expect.objectContaining({ kind: "warning" })
      );
      expect(invoke).toHaveBeenCalledWith("trash_entry", { path: "C:\\photos\\target.jpg" });
      expect(mockLoadDirectory).toHaveBeenCalledWith("C:\\photos", true);
      expect(success).toBe(true);
    });

    it("confirmDeleteが有効でユーザーがキャンセルした場合、削除を中止しfalseを返すこと", async () => {
      (confirm as any).mockResolvedValue(false);

      const { result } = renderHook(() => useFileOperations(mockLoadDirectory));

      let success = true;
      await act(async () => {
        success = await result.current.trashEntry(
          "C:\\photos\\target.jpg",
          "C:\\photos",
          { confirmDelete: true }
        );
      });

      expect(confirm).toHaveBeenCalled();
      expect(invoke).not.toHaveBeenCalled();
      expect(mockLoadDirectory).not.toHaveBeenCalled();
      expect(success).toBe(false);
    });

    it("confirmDeleteがfalseの場合、確認ダイアログを出さずに即座にごみ箱へ移動すること", async () => {
      (invoke as any).mockResolvedValue(undefined);
      mockLoadDirectory.mockResolvedValue(undefined);

      const { result } = renderHook(() => useFileOperations(mockLoadDirectory));

      let success = false;
      await act(async () => {
        success = await result.current.trashEntry(
          "C:\\photos\\direct.jpg",
          "C:\\photos",
          { confirmDelete: false }
        );
      });

      expect(confirm).not.toHaveBeenCalled();
      expect(invoke).toHaveBeenCalledWith("trash_entry", { path: "C:\\photos\\direct.jpg" });
      expect(mockLoadDirectory).toHaveBeenCalledWith("C:\\photos", true);
      expect(success).toBe(true);
    });

    it("invokeがエラーを返した場合、エラーダイアログを表示してfalseを返すこと", async () => {
      (confirm as any).mockResolvedValue(true);
      (invoke as any).mockRejectedValue(new Error("Permission denied"));

      const { result } = renderHook(() => useFileOperations(mockLoadDirectory));

      let success = true;
      await act(async () => {
        success = await result.current.trashEntry(
          "C:\\photos\\error.jpg",
          "C:\\photos",
          { confirmDelete: true }
        );
      });

      expect(invoke).toHaveBeenCalledWith("trash_entry", { path: "C:\\photos\\error.jpg" });
      expect(message).toHaveBeenCalledWith("Permission denied", expect.anything());
      expect(success).toBe(false);
    });
  });
});
