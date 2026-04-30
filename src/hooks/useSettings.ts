import { useState, useEffect } from "react";
import { appDataDir } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";

export function useSettings() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("storage");
  const [dataStoragePath, setDataStoragePath] = useState("");
  const [historyRetentionDays, setHistoryRetentionDays] = useState(30);
  const [startupFolderType, setStartupFolderType] = useState<string>("none"); // "none" or "last"

  useEffect(() => {
    const initSettings = async () => {
      // Storage Path
      const savedPath = localStorage.getItem("dataStoragePath");
      if (savedPath) {
        setDataStoragePath(savedPath);
      } else {
        try {
          const defaultPath = await appDataDir();
          setDataStoragePath(defaultPath);
          localStorage.setItem("dataStoragePath", defaultPath);
        } catch (e) {
          console.error("Failed to get default app data dir:", e);
        }
      }

      // History Retention
      const savedDays = localStorage.getItem("historyRetentionDays");
      if (savedDays !== null) {
        setHistoryRetentionDays(parseInt(savedDays, 10));
      }

      // Startup Folder Type
      const savedStartupType = localStorage.getItem("startupFolderType");
      if (savedStartupType !== null) {
        setStartupFolderType(savedStartupType);
      }
    };
    initSettings();
  }, []);

  const changeStoragePath = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "保存先フォルダを選択してください"
      });
      if (selected && typeof selected === 'string') {
        setDataStoragePath(selected);
        localStorage.setItem("dataStoragePath", selected);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const updateHistoryRetention = (days: number) => {
    const value = Math.max(0, Math.min(1000, days));
    setHistoryRetentionDays(value);
    localStorage.setItem("historyRetentionDays", value.toString());
  };

  const updateStartupFolderType = (type: string) => {
    setStartupFolderType(type);
    localStorage.setItem("startupFolderType", type);
  };

  return {
    isSettingsOpen,
    setIsSettingsOpen,
    activeSettingsTab,
    setActiveSettingsTab,
    dataStoragePath,
    changeStoragePath,
    historyRetentionDays,
    updateHistoryRetention,
    startupFolderType,
    updateStartupFolderType,
  };
}
