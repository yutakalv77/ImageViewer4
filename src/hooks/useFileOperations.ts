import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import { message } from "@tauri-apps/plugin-dialog";
import { getRenamedPath, isValidFileName } from "../utils/fileUtils";

export function useFileOperations(loadDirectory: (path: string, skipHistory?: boolean) => Promise<void>) {
  const { t } = useTranslation();

  const renameEntry = useCallback(async (oldPath: string, newName: string, currentPath: string): Promise<string> => {
    const trimmed = newName.trim();
    if (!isValidFileName(trimmed)) {
      await message(t('common.error_rename_invalid', { defaultValue: 'ファイル名に無効な文字が含まれているか、空です。' }), {
        title: t('common.error_rename', { defaultValue: '名前の変更に失敗しました' }),
        kind: 'error',
      });
      throw new Error("Invalid file name");
    }

    try {
      const newPath = getRenamedPath(oldPath, trimmed);
      if (newPath === oldPath) {
        return oldPath;
      }
      await invoke("rename_entry", { oldPath, newPath });
      await loadDirectory(currentPath, true); // Refresh without adding to history
      return newPath;
    } catch (err: any) {
      console.error("Failed to rename:", err);
      const errMsg = err?.message || String(err);
      await message(errMsg, {
        title: t('common.error_rename', { defaultValue: '名前の変更に失敗しました' }),
        kind: 'error',
      });
      throw err;
    }
  }, [loadDirectory, t]);

  return {
    renameEntry
  };
}

