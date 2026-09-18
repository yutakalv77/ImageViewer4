import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import { message, confirm } from "@tauri-apps/plugin-dialog";
import { getRenamedPath, isValidFileName, getEntryNameFromPath, canTrashEntry } from "../utils/fileUtils";

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

  const trashEntry = useCallback(async (
    path: string,
    currentPath: string,
    options?: { confirmDelete?: boolean }
  ): Promise<boolean> => {
    if (!canTrashEntry(path)) {
      return false;
    }

    const shouldConfirm = options?.confirmDelete ?? true;
    if (shouldConfirm) {
      const fileName = getEntryNameFromPath(path);
      const isConfirmed = await confirm(
        t('common.confirm_delete_message', { name: fileName, defaultValue: `'${fileName}' をごみ箱へ移動しますか？` }),
        {
          title: t('common.confirm_delete_title', { defaultValue: 'ごみ箱へ移動' }),
          kind: 'warning',
        }
      );
      if (!isConfirmed) {
        return false;
      }
    }

    try {
      await invoke("trash_entry", { path });
      await loadDirectory(currentPath, true);
      return true;
    } catch (err: any) {
      console.error("Failed to move to trash:", err);
      const errMsg = err?.message || String(err);
      await message(errMsg, {
        title: t('common.error_delete', { defaultValue: '削除に失敗しました' }),
        kind: 'error',
      });
      return false;
    }
  }, [loadDirectory, t]);

  return {
    renameEntry,
    trashEntry,
  };
}


