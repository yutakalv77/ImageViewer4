import { useState, useEffect, useCallback } from "react";
import { appDataDir } from "@tauri-apps/api/path";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/plugin-dialog";
import i18n from "../i18n";
import { ViewMode, ReadingDirection, ThemeMode, StartupFolderType } from "../types";

export function useSettings() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("general");
  const [dataStoragePath, setDataStoragePath] = useState("");
  const [historyRetentionDays, setHistoryRetentionDays] = useState(30);
  const [startupFolderType, setStartupFolderType] = useState<StartupFolderType>("none");
  
  const [slideInterval, setSlideInterval] = useState(3.0);
  const [slideLoop, setSlideLoop] = useState(true);

  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [readingDirection, setReadingDirection] = useState<ReadingDirection>("rtl");
  const [firstPageIsCover, setFirstPageIsCover] = useState(true);

  const [language, setLanguage] = useState<string>(i18n.language || "ja");
  const [theme, setTheme] = useState<ThemeMode>("dark");

  const applyTheme = useCallback(async (targetTheme: ThemeMode) => {
    const appWindow = getCurrentWindow();
    let effectiveTheme: string = targetTheme;
    
    if (targetTheme === "system") {
      const osTheme = await appWindow.theme();
      effectiveTheme = osTheme || "dark";
    }
    
    document.documentElement.setAttribute("data-theme", effectiveTheme);
  }, []);

  useEffect(() => {
    const initSettings = async () => {
      // Data Storage Path
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

      // History
      const savedDays = localStorage.getItem("historyRetentionDays");
      if (savedDays !== null) setHistoryRetentionDays(parseInt(savedDays, 10));

      const savedStartupType = localStorage.getItem("startupFolderType") as StartupFolderType;
      if (savedStartupType) setStartupFolderType(savedStartupType);

      // Slideshow
      const savedSlideInterval = localStorage.getItem("slideInterval");
      if (savedSlideInterval !== null) setSlideInterval(parseFloat(savedSlideInterval));
      const savedSlideLoop = localStorage.getItem("slideLoop");
      if (savedSlideLoop !== null) setSlideLoop(savedSlideLoop === "true");

      // View
      const savedViewMode = localStorage.getItem("viewMode") as ViewMode;
      if (savedViewMode) setViewMode(savedViewMode);
      const savedDirection = localStorage.getItem("readingDirection") as ReadingDirection;
      if (savedDirection) setReadingDirection(savedDirection);
      const savedCover = localStorage.getItem("firstPageIsCover");
      if (savedCover !== null) setFirstPageIsCover(savedCover === "true");

      // Language & Theme
      const savedLang = localStorage.getItem("language");
      if (savedLang) {
        setLanguage(savedLang);
        i18n.changeLanguage(savedLang);
      }

      const savedTheme = localStorage.getItem("theme") as ThemeMode;
      if (savedTheme) {
        setTheme(savedTheme);
        applyTheme(savedTheme);
      } else {
        applyTheme("dark");
      }
    };
    initSettings();
  }, [applyTheme]);

  // Listen for OS theme changes
  useEffect(() => {
    if (theme !== "system") return;
    
    const unlisten = getCurrentWindow().onThemeChanged(({ payload: newTheme }) => {
      document.documentElement.setAttribute("data-theme", newTheme);
    });
    
    return () => { unlisten.then(fn => fn()); };
  }, [theme]);

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
    } catch (e) {
      console.error(e);
    }
  };

  const updateHistoryRetention = (days: number) => {
    const value = Math.max(0, Math.min(1000, days));
    setHistoryRetentionDays(value);
    localStorage.setItem("historyRetentionDays", value.toString());
  };

  const updateStartupFolderType = (type: StartupFolderType) => {
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

  const updateViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("viewMode", mode);
  };

  const updateReadingDirection = (direction: ReadingDirection) => {
    setReadingDirection(direction);
    localStorage.setItem("readingDirection", direction);
  };

  const toggleFirstPageIsCover = () => {
    const newValue = !firstPageIsCover;
    setFirstPageIsCover(newValue);
    localStorage.setItem("firstPageIsCover", newValue.toString());
  };

  const updateLanguage = (newLang: string) => {
    setLanguage(newLang);
    localStorage.setItem("language", newLang);
    i18n.changeLanguage(newLang);
  };

  const updateTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
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
    toggleFirstPageIsCover,
    language,
    updateLanguage,
    theme,
    updateTheme
  };
}
