import { useState, useCallback, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { EntryItem, DirectoryResult } from "../types";
import { 
  isVirtualPath, isSearchPath, getSearchQuery, 
  isEverythingSearchPath, VIRTUAL_PATH_SEARCH_PREFIX, VIRTUAL_PATH_EVERYTHING_PREFIX
} from "../utils/virtualPathUtils";
import { useNavigationHistory } from "./useNavigationHistory";

export function useFileSystem() {
  const [currentPath, setCurrentPath] = useState("");
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const history = useNavigationHistory();
  const lastPhysicalPathRef = useRef("");

  const loadDirectory = useCallback(async (path: string, skipHistory = false, maxResults = 50, cliPath = "") => {
    if (!path) return;

    if (!skipHistory && currentPath && currentPath !== path) {
      history.pushToHistory(currentPath);
    }

    setLoading(true);
    try {
      if (isEverythingSearchPath(path)) {
        const query = getSearchQuery(path);
        const results: EntryItem[] = await invoke("search_everything", { query, maxResults, cliPath });
        setEntries(results);
        setCurrentPath(path);
        setError(null);
        return;
      }

      if (isSearchPath(path)) {
        const query = getSearchQuery(path);
        const root = lastPhysicalPathRef.current;
        if (!root) {
          setCurrentPath(path);
          setEntries([]);
          setError(null);
          return;
        }
        const results: EntryItem[] = await invoke("search_folders", { rootPath: root, query });
        setEntries(results);
        setCurrentPath(path);
        setError(null);
        return;
      }

      if (isVirtualPath(path)) {
        setCurrentPath(path);
        setEntries([]);
        setError(null);
        return;
      }

      // Physical path
      const result: DirectoryResult = await invoke("get_directory_entries", { path });
      const normalizedNewPath = result.path;
      setEntries(result.entries);
      setCurrentPath(normalizedNewPath);
      lastPhysicalPathRef.current = normalizedNewPath;
      setError(null);
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      // Don't throw, just set error state
    } finally {
      setLoading(false);
    }
  }, [currentPath, history]);

  const searchFolders = useCallback(async (rootPath: string, query: string) => {
    if (!rootPath) return;
    const searchPath = VIRTUAL_PATH_SEARCH_PREFIX + query;
    lastPhysicalPathRef.current = rootPath;
    await loadDirectory(searchPath);
  }, [loadDirectory]);

  const everythingSearch = useCallback(async (query: string, maxResults: number, cliPath: string) => {
    const searchPath = VIRTUAL_PATH_EVERYTHING_PREFIX + query;
    await loadDirectory(searchPath, false, maxResults, cliPath);
  }, [loadDirectory]);

  const goBack = useCallback(() => {
    const previous = history.popBack(currentPath);
    if (previous) {
      loadDirectory(previous, true);
    }
  }, [currentPath, history, loadDirectory]);

  const goForward = useCallback(() => {
    const next = history.popForward(currentPath);
    if (next) {
      loadDirectory(next, true);
    }
  }, [currentPath, history, loadDirectory]);

  const goUp = useCallback(() => {
    if (!currentPath || isVirtualPath(currentPath)) return;
    
    // Normalize path separators
    const normalizedPath = currentPath.replace(/\\/g, '/');
    const parts = normalizedPath.split('/').filter(Boolean);
    
    if (parts.length > 1) {
      // For Windows drive roots (e.g., C:/), lastIndexOf might be tricky
      const lastSlashIdx = normalizedPath.lastIndexOf('/');
      let parent = currentPath.substring(0, lastSlashIdx);
      
      // Handle drive root case (e.g., C: -> C:/)
      if (parent.endsWith(':')) {
          parent += currentPath.includes('\\') ? '\\' : '/';
      }
      
      if (parent) {
        loadDirectory(parent);
      }
    } else if (parts.length === 1) {
       // Root level handling
       const separator = currentPath.includes('\\') ? '\\' : '/';
       if (currentPath.includes(':') && !currentPath.endsWith(separator)) {
           loadDirectory(parts[0] + separator);
       }
    }
  }, [currentPath, loadDirectory]);

  return {
    currentPath,
    entries,
    setEntries,
    loading,
    error,
    canGoBack: history.canGoBack,
    canGoForward: history.canGoForward,
    loadDirectory,
    searchFolders,
    everythingSearch,
    goUp,
    goBack,
    goForward,
    setError,
  };
}
