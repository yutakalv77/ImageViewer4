import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { EntryItem, DirectoryResult } from "../types";
import { 
  isVirtualPath, isSearchPath, getSearchQuery, 
  VIRTUAL_PATH_SEARCH_PREFIX, VIRTUAL_PATH_EVERYTHING_PREFIX, 
  isEverythingSearchPath 
} from "../utils/virtualPathUtils";

export function useFileSystem() {
  const [currentPath, setCurrentPath] = useState("");
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [backStack, setBackStack] = useState<string[]>([]);
  const [forwardStack, setForwardStack] = useState<string[]>([]);

  const [lastPhysicalPath, setLastPhysicalPath] = useState("");

  const loadDirectory = useCallback(async (path: string, skipHistory = false, maxResults = 50, cliPath = "") => {
    if (!path) return;

    if (!skipHistory && currentPath && currentPath !== path) {
      setBackStack(prev => [...prev, currentPath]);
      setForwardStack([]); 
    }

    if (isEverythingSearchPath(path)) {
      const query = getSearchQuery(path);
      setLoading(true);
      try {
        const results: EntryItem[] = await invoke("search_everything", { query, maxResults, cliPath });
        setEntries(results);
        setCurrentPath(path);
        setError(null);
      } catch (e: any) {
        setError(e.toString());
        throw e;
      } finally {
        setLoading(false);
      }
      return;
    }

    if (isSearchPath(path)) {
      const query = getSearchQuery(path);
      const root = lastPhysicalPath;
      if (!root) {
        setCurrentPath(path);
        setEntries([]);
        return;
      }
      setLoading(true);
      try {
        const results: EntryItem[] = await invoke("search_folders", { rootPath: root, query });
        setEntries(results);
        setCurrentPath(path);
        setError(null);
      } catch (e: any) {
        setError(e.toString());
      } finally {
        setLoading(false);
      }
      return;
    }

    if (isVirtualPath(path)) {
      setCurrentPath(path);
      setEntries([]);
      setError(null);
      return;
    }

    setLoading(true);
    try {
      const result: DirectoryResult = await invoke("get_directory_entries", { path });
      const normalizedNewPath = result.path;
      setEntries(result.entries);
      setCurrentPath(normalizedNewPath);
      setLastPhysicalPath(normalizedNewPath);
      setError(null);
    } catch (e: any) {
      setError(e.toString());
    } finally {
      setLoading(false);
    }
  }, [currentPath, lastPhysicalPath]);

  const searchFolders = useCallback(async (rootPath: string, query: string) => {
    if (!rootPath || isVirtualPath(rootPath)) return;
    const searchPath = VIRTUAL_PATH_SEARCH_PREFIX + query;
    setLastPhysicalPath(rootPath);
    await loadDirectory(searchPath);
  }, [loadDirectory]);

  const everythingSearch = useCallback(async (query: string, maxResults: number, cliPath: string) => {
    const searchPath = VIRTUAL_PATH_EVERYTHING_PREFIX + query;
    await loadDirectory(searchPath, false, maxResults, cliPath);
  }, [loadDirectory]);

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
    if (!currentPath || isVirtualPath(currentPath)) return;
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
    setEntries,
    loading,
    error,
    canGoBack: backStack.length > 0,
    canGoForward: forwardStack.length > 0,
    loadDirectory,
    searchFolders,
    everythingSearch,
    openFolderDialog,
    goUp,
    goBack,
    goForward,
    setError,
  };
}
