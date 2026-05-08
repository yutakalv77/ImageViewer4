import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";

export function useFileOperations(loadDirectory: (path: string, skipHistory?: boolean) => Promise<void>) {
  const { t } = useTranslation();

  const renameEntry = useCallback(async (oldPath: string, newName: string, currentPath: string) => {
    try {
      const separator = oldPath.includes('\\') ? '\\' : '/';
      const pathParts = oldPath.split(separator);
      pathParts.pop();
      const newPath = [...pathParts, newName].join(separator);

      await invoke("rename_entry", { oldPath, newPath });
      await loadDirectory(currentPath, true); // Refresh without adding to history
    } catch (err) {
      console.error("Failed to rename:", err);
      alert(t('common.error_rename'));
      throw err;
    }
  }, [loadDirectory, t]);

  return {
    renameEntry
  };
}
