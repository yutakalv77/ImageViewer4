import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { EntryItem, DirectoryResult } from "../types";

export function useFileSystem() {
  const [currentPath, setCurrentPath] = useState("");
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [backStack, setBackStack] = useState<string[]>([]);
  const [forwardStack, setForwardStack] = useState<string[]>([]);

  const loadDirectory = useCallback(async (path: string, skipHistory = false) => {
    if (!path) return;
    setLoading(true);
    try {
      const result: DirectoryResult = await invoke("get_directory_entries", { path });
      const normalizedNewPath = result.path;

      if (!skipHistory && currentPath && currentPath !== normalizedNewPath) {
        setBackStack(prev => [...prev, currentPath]);
        setForwardStack([]); // Clear forward stack on new navigation
      }

      setEntries(result.entries);
      setCurrentPath(normalizedNewPath);
      setError(null);
    } catch (e: any) {
      setError(e.toString());
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  const goBack = useCallback(() => {
    if (backStack.length === 0) return;
    const previous = backStack[backStack.length - 1];
    setBackStack(prev => prev.slice(0, -1));
    if (currentPath) {
      setForwardStack(prev => [...prev, currentPath]);
    }
    loadDirectory(previous, true);
  }, [backStack, currentPath, loadDirectory]);

  const goForward = useCallback(() => {
    if (forwardStack.length === 0) return;
    const next = forwardStack[forwardStack.length - 1];
    setForwardStack(prev => prev.slice(0, -1));
    if (currentPath) {
      setBackStack(prev => [...prev, currentPath]);
    }
    loadDirectory(next, true);
  }, [forwardStack, currentPath, loadDirectory]);

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
    canGoBack: backStack.length > 0,
    canGoForward: forwardStack.length > 0,
    loadDirectory,
    openFolderDialog,
    goUp,
    goBack,
    goForward,
  };
}
