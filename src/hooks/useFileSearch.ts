import { useState, useCallback, useMemo } from "react";
import { 
  VIRTUAL_PATH_SEARCH_PREFIX, 
  VIRTUAL_PATH_EVERYTHING_PREFIX 
} from "../utils/pathUtils";

export function useFileSearch(
  loadDirectory: (path: string, skipHistory?: boolean, maxResults?: number, cliPath?: string) => Promise<void>
) {
  const [lastPhysicalPath, setLastPhysicalPath] = useState("");

  const searchFolders = useCallback(async (rootPath: string, query: string) => {
    if (!rootPath) return;
    const searchPath = VIRTUAL_PATH_SEARCH_PREFIX + query;
    setLastPhysicalPath(rootPath);
    await loadDirectory(searchPath);
  }, [loadDirectory]);

  const everythingSearch = useCallback(async (query: string, maxResults: number, cliPath: string) => {
    const searchPath = VIRTUAL_PATH_EVERYTHING_PREFIX + query;
    await loadDirectory(searchPath, false, maxResults, cliPath);
  }, [loadDirectory]);

  return useMemo(() => ({
    lastPhysicalPath,
    setLastPhysicalPath,
    searchFolders,
    everythingSearch
  }), [lastPhysicalPath, searchFolders, everythingSearch]);
}
