import { useState, useEffect } from "react";
import { appDataDir } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";

export function useSettings() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("storage");
  const [dataStoragePath, setDataStoragePath] = useState("");

  useEffect(() => {
    const initSettings = async () => {
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

  return {
    isSettingsOpen,
    setIsSettingsOpen,
    activeSettingsTab,
    setActiveSettingsTab,
    dataStoragePath,
    changeStoragePath,
  };
}
