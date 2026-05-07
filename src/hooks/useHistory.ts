import { useState, useEffect, useCallback } from "react";
import { readTextFile, writeTextFile, exists, mkdir } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { HistoryEntry } from "../types";

export function useHistory(storagePath: string, retentionDays: number) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const getHistoryFilePath = useCallback(async () => {
    if (!storagePath) return null;
    return await join(storagePath, "history.json");
  }, [storagePath]);

  const loadHistory = useCallback(async () => {
    const filePath = await getHistoryFilePath();
    if (!filePath) return;

    try {
      if (await exists(filePath)) {
        const content = await readTextFile(filePath);
        const data: HistoryEntry[] = JSON.parse(content);
        
        // Prune old entries
        const now = Date.now();
        const pruned = data.filter(entry => {
          const diffDays = (now - entry.lastVisited) / (1000 * 60 * 60 * 24);
          return diffDays <= retentionDays;
        });

        setHistory(pruned);
      }
    } catch (e) {
      console.error("Failed to load history:", e);
    } finally {
      setIsLoaded(true);
    }
  }, [getHistoryFilePath, retentionDays]);

  const saveHistory = useCallback(async (newHistory: HistoryEntry[]) => {
    const filePath = await getHistoryFilePath();
    if (!filePath || !storagePath) return;

    try {
      if (!(await exists(storagePath))) {
        await mkdir(storagePath, { recursive: true });
      }
      await writeTextFile(filePath, JSON.stringify(newHistory, null, 2));
    } catch (e) {
      console.error("Failed to save history:", e);
    }
  }, [getHistoryFilePath, storagePath]);

  const recordHistory = useCallback((path: string) => {
    if (retentionDays === 0) return;
    
    const now = Date.now();
    setHistory(prev => {
      const filtered = prev.filter(e => e.path !== path);
      const updated = [{ path, lastVisited: now }, ...filtered];
      return updated.slice(0, 100);
    });
  }, [retentionDays]);

  useEffect(() => {
    if (isLoaded) {
      saveHistory(history);
    }
  }, [history, isLoaded, saveHistory]);

  useEffect(() => {
    if (storagePath) {
      loadHistory();
    }
  }, [storagePath, loadHistory]);

  return {
    history,
    recordHistory,
    isLoaded,
  };
}
