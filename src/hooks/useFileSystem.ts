import { useState, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { EntryItem, DirectoryResult } from "../types";
import { 
  isVirtualPath, isSearchPath, getSearchQuery, 
  isEverythingSearchPath, VIRTUAL_PATH_SEARCH_PREFIX, VIRTUAL_PATH_EVERYTHING_PREFIX,
  getParentPath
} from "../utils/pathUtils";
import { useNavigationHistory } from "./useNavigationHistory";

export function useFileSystem() {
  const [currentPath, setCurrentPath] = useState("");
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const history = useNavigationHistory();
  const lastPhysicalPathRef = useRef("");
  const lastLoadIdRef = useRef(0);

  /**
   * Internal helper to update state only if the load ID matches the latest one.
   */
  const updateStateIfLatest = useCallback((loadId: number, updates: { entries?: EntryItem[], path?: string, error?: string | null }) => {
    if (loadId !== lastLoadIdRef.current) return;
    
    if (updates.entries !== undefined) setEntries(updates.entries);
    if (updates.path !== undefined) {
      setCurrentPath(updates.path);
      if (!isVirtualPath(updates.path)) {
        lastPhysicalPathRef.current = updates.path;
      }
    }
    if (updates.error !== undefined) setError(updates.error);
    setLoading(false);
  }, []);

  const loadDirectory = useCallback(async (path: string, skipHistory = false, maxResults = 50, cliPath = "") => {
    if (!path) return;

    const loadId = ++lastLoadIdRef.current;

    if (!skipHistory && currentPath && currentPath !== path) {
      history.pushToHistory(currentPath);
    }

    setLoading(true);
    try {
      // 1. Everything Search
      if (isEverythingSearchPath(path)) {
        const query = getSearchQuery(path);
        const results: EntryItem[] = await invoke("search_everything", { query, maxResults, cliPath });
        updateStateIfLatest(loadId, { entries: results, path, error: null });
        return;
      }

      // 2. Local Search
      if (isSearchPath(path)) {
        const query = getSearchQuery(path);
        const root = lastPhysicalPathRef.current;
        if (!root) {
          updateStateIfLatest(loadId, { entries: [], path, error: null });
          return;
        }
        const results: EntryItem[] = await invoke("search_folders", { rootPath: root, query });
        updateStateIfLatest(loadId, { entries: results, path, error: null });
        return;
      }

      // 3. Virtual Paths (handled by context for data, but path state is here)
      if (isVirtualPath(path)) {
        updateStateIfLatest(loadId, { entries: [], path, error: null });
        return;
      }

      // 4. Physical path
      const result: DirectoryResult = await invoke("get_directory_entries", { path });
      updateStateIfLatest(loadId, { entries: result.entries, path: result.path, error: null });
    } catch (e: any) {
      updateStateIfLatest(loadId, { error: e instanceof Error ? e.message : String(e) });
    }
  }, [currentPath, history, updateStateIfLatest]);

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
    const parent = getParentPath(currentPath);
    if (parent) {
      loadDirectory(parent);
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
