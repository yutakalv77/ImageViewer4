import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

export interface UseEverythingStatusOptions {
  pollingIntervalMs?: number;
  initialCheck?: boolean;
}

export interface UseEverythingStatusReturn {
  isRunning: boolean | null;
  checkStatus: () => Promise<boolean>;
  pickCliPath: (dialogTitle?: string) => Promise<string | null>;
}

/**
 * Everything サービスの稼働ステータスポーリングおよび CLI 実行可能ファイル選択ダイアログを管理するカスタムフック
 */
export function useEverythingStatus(options: UseEverythingStatusOptions = {}): UseEverythingStatusReturn {
  const { pollingIntervalMs = 5000, initialCheck = true } = options;
  const [isRunning, setIsRunning] = useState<boolean | null>(null);

  const checkStatus = useCallback(async (): Promise<boolean> => {
    try {
      const status: boolean = await invoke("check_everything_running");
      setIsRunning(status);
      return status;
    } catch (e) {
      console.error("Failed to check Everything status:", e);
      setIsRunning(false);
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    if (initialCheck) {
      checkStatus();
    }

    if (pollingIntervalMs > 0) {
      intervalId = setInterval(() => {
        if (isMounted) {
          checkStatus();
        }
      }, pollingIntervalMs);
    }

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [checkStatus, initialCheck, pollingIntervalMs]);

  const pickCliPath = useCallback(async (dialogTitle?: string): Promise<string | null> => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Executable", extensions: ["exe"] }],
        title: dialogTitle,
      });
      if (selected && typeof selected === "string") {
        return selected;
      }
      return null;
    } catch (e) {
      console.error("Failed to open CLI picker dialog:", e);
      return null;
    }
  }, []);

  return {
    isRunning,
    checkStatus,
    pickCliPath,
  };
}
