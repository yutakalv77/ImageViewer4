import { useState, useCallback, useMemo } from "react";
import { 
  VIRTUAL_PATH_SEARCH_PREFIX, 
  VIRTUAL_PATH_EVERYTHING_PREFIX,
  isVirtualPath
} from "../utils/pathUtils";
import { SearchScope } from "../types";
import { toggleSearchScope as toggleScopeUtil } from "../utils/searchUtils";

export interface UseFileSearchOptions {
  loadDirectory: (path: string, skipHistory?: boolean, maxResults?: number, cliPath?: string) => Promise<void>;
  onSetLastPhysicalPath?: (path: string) => void;
}

export interface ExecuteSearchOptions {
  query: string;
  scope: SearchScope;
  currentPath: string;
  historyFallbackPath?: string;
  everythingEnabled?: boolean;
  everythingMaxResults: number;
  everythingCliPath: string;
  checkEverythingRunning?: () => Promise<boolean>;
  onEverythingError?: (error: unknown) => void;
}

export function useFileSearch({
  loadDirectory,
  onSetLastPhysicalPath,
}: UseFileSearchOptions) {
  const [lastPhysicalPath, setLastPhysicalPath] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScope>("folder");

  const toggleSearchScope = useCallback(() => {
    setSearchScope((prev) => toggleScopeUtil(prev));
  }, []);

  const searchFolders = useCallback(async (rootPath: string, query: string) => {
    if (!rootPath) return;
    const searchPath = VIRTUAL_PATH_SEARCH_PREFIX + query;
    setLastPhysicalPath(rootPath);
    if (onSetLastPhysicalPath) {
      onSetLastPhysicalPath(rootPath);
    }
    await loadDirectory(searchPath);
  }, [loadDirectory, onSetLastPhysicalPath]);

  const everythingSearch = useCallback(async (query: string, maxResults: number, cliPath: string) => {
    const searchPath = VIRTUAL_PATH_EVERYTHING_PREFIX + query;
    await loadDirectory(searchPath, false, maxResults, cliPath);
  }, [loadDirectory]);

  const fallbackFolderSearch = useCallback(
    async (currentPath: string, historyFallbackPath: string | undefined, query: string) => {
      if (currentPath && !isVirtualPath(currentPath)) {
        await searchFolders(currentPath, query);
      } else if (historyFallbackPath) {
        await searchFolders(historyFallbackPath, query);
      }
    },
    [searchFolders]
  );

  const executeSearch = useCallback(
    async (options: ExecuteSearchOptions) => {
      const {
        query,
        scope,
        currentPath,
        historyFallbackPath,
        everythingEnabled = true,
        everythingMaxResults,
        everythingCliPath,
        checkEverythingRunning,
        onEverythingError,
      } = options;

      const trimmed = query.trim();
      if (!trimmed) return;

      if (scope === "everything" && everythingEnabled) {
        try {
          if (checkEverythingRunning) {
            const isRunning = await checkEverythingRunning();
            if (!isRunning) {
              throw new Error("Everything is not running");
            }
          }
          await everythingSearch(trimmed, everythingMaxResults, everythingCliPath);
        } catch (err) {
          if (onEverythingError) {
            onEverythingError(err);
          }
          await fallbackFolderSearch(currentPath, historyFallbackPath, trimmed);
        }
      } else {
        await fallbackFolderSearch(currentPath, historyFallbackPath, trimmed);
      }
    },
    [everythingSearch, fallbackFolderSearch]
  );

  return useMemo(() => ({
    lastPhysicalPath,
    setLastPhysicalPath,
    searchScope,
    setSearchScope,
    toggleSearchScope,
    searchFolders,
    everythingSearch,
    executeSearch,
  }), [
    lastPhysicalPath,
    searchScope,
    toggleSearchScope,
    searchFolders,
    everythingSearch,
    executeSearch,
  ]);
}
