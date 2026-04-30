import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { EntryItem, DirectoryResult } from "../types";

export function useFileSystem() {
  const [currentPath, setCurrentPath] = useState("");
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDirectory = useCallback(async (path: string) => {
    if (!path) return;
    setLoading(true);
    try {
      const result: DirectoryResult = await invoke("get_directory_entries", { path });
      setEntries(result.entries);
      setCurrentPath(result.path);
      setError(null);
    } catch (e: any) {
      setError(e.toString());
    } finally {
      setLoading(false);
    }
  }, []);

  const openFolderDialog = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "フォルダを選択してください"
      });
      if (selected && typeof selected === 'string') {
        loadDirectory(selected);
      }
    } catch (e: any) {
      console.error(e);
    }
  }, [loadDirectory]);

  const goUp = useCallback(() => {
    if (!currentPath) return;
    const separator = currentPath.includes("\\") ? "\\" : "/";
    const parts = currentPath.split(separator).filter(Boolean);
    if (parts.length > 1) {
      const parent = currentPath.substring(0, currentPath.lastIndexOf(separator));
      loadDirectory(parent);
    } else if (parts.length === 1 && currentPath.includes(separator)) {
      const driveRoot = parts[0] + separator;
      if (currentPath !== driveRoot) {
        loadDirectory(driveRoot);
      }
    }
  }, [currentPath, loadDirectory]);

  return {
    currentPath,
    entries,
    loading,
    error,
    loadDirectory,
    openFolderDialog,
    goUp,
  };
}
