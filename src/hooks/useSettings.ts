import { useState, useEffect } from "react";
import { appDataDir } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";

export function useSettings() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("storage");
  const [dataStoragePath, setDataStoragePath] = useState("");
  const [historyRetentionDays, setHistoryRetentionDays] = useState(30);
  const [startupFolderType, setStartupFolderType] = useState<string>("none"); // "none" or "last"
  
  // Slideshow settings
  const [slideInterval, setSlideInterval] = useState(3.0);
  const [slideLoop, setSlideLoop] = useState(true);

  // View settings
  const [viewMode, setViewMode] = useState<"single" | "spread">("single");
  const [readingDirection, setReadingDirection] = useState<"rtl" | "ltr">("rtl");
  const [firstPageIsCover, setFirstPageIsCover] = useState(true);

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
      if (savedDays !== null) setHistoryRetentionDays(parseInt(savedDays, 10));

      // Startup Folder Type
      const savedStartupType = localStorage.getItem("startupFolderType");
      if (savedStartupType !== null) setStartupFolderType(savedStartupType);

      // Slideshow settings
      const savedSlideInterval = localStorage.getItem("slideInterval");
      if (savedSlideInterval !== null) setSlideInterval(parseFloat(savedSlideInterval));
      const savedSlideLoop = localStorage.getItem("slideLoop");
      if (savedSlideLoop !== null) setSlideLoop(savedSlideLoop === "true");

      // View settings
      const savedViewMode = localStorage.getItem("viewMode") as any;
      if (savedViewMode) setViewMode(savedViewMode);
      const savedDirection = localStorage.getItem("readingDirection") as any;
      if (savedDirection) setReadingDirection(savedDirection);
      const savedCover = localStorage.getItem("firstPageIsCover");
      if (savedCover !== null) setFirstPageIsCover(savedCover === "true");
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

  const updateSlideInterval = (seconds: number) => {
    const value = Math.max(0.1, Math.min(99.9, seconds));
    setSlideInterval(value);
    localStorage.setItem("slideInterval", value.toString());
  };

  const toggleSlideLoop = () => {
    const newValue = !slideLoop;
    setSlideLoop(newValue);
    localStorage.setItem("slideLoop", newValue.toString());
  };

  const updateViewMode = (mode: "single" | "spread") => {
    setViewMode(mode);
    localStorage.setItem("viewMode", mode);
  };

  const updateReadingDirection = (direction: "rtl" | "ltr") => {
    setReadingDirection(direction);
    localStorage.setItem("readingDirection", direction);
  };

  const toggleFirstPageIsCover = () => {
    const newValue = !firstPageIsCover;
    setFirstPageIsCover(newValue);
    localStorage.setItem("firstPageIsCover", newValue.toString());
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
    slideInterval,
    updateSlideInterval,
    slideLoop,
    toggleSlideLoop,
    viewMode,
    updateViewMode,
    readingDirection,
    updateReadingDirection,
    firstPageIsCover,
    toggleFirstPageIsCover
  };
}
