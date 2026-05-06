import { useState, useEffect, useCallback } from "react";
import { appDataDir } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile, exists, mkdir } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { BackgroundSettings, StartupFolderType, ThemeMode } from "../types";

export function useSettings() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("general");
  const [dataStoragePath, setDataStoragePath] = useState<string>("");
  const [historyRetentionDays, setHistoryRetentionDays] = useState<number>(30);
  const [startupFolderType, setStartupFolderType] = useState<StartupFolderType>("none");
  const [slideInterval, setSlideInterval] = useState<number>(3);
  const [slideLoop, setSlideLoop] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<"single" | "spread">("single");
  const [readingDirection, setReadingDirection] = useState<"rtl" | "ltr">("rtl");
  const [firstPageIsCover, setFirstPageIsCover] = useState<boolean>(true);
  const [language, setLanguage] = useState<string>("ja");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [background, setBackground] = useState<BackgroundSettings>({
    path: null,
    opacity: 0.3,
    blur: 5,
    style: "cover",
  });
  const [everythingEnabled, setEverythingEnabled] = useState<boolean>(false);
  const [everythingMaxResults, setEverythingMaxResults] = useState<number>(50);
  const [everythingCliPath, setEverythingCliPath] = useState<string>("");

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const appDir = await appDataDir();
        const configPath = await join(appDir, "config.json");
        
        if (!(await exists(configPath))) {
          setDataStoragePath(appDir);
          setIsLoaded(true);
          return;
        }

        const content = await readTextFile(configPath);
        const config = JSON.parse(content);
        
        if (config.dataStoragePath) setDataStoragePath(config.dataStoragePath);
        if (config.historyRetentionDays !== undefined) setHistoryRetentionDays(config.historyRetentionDays);
        if (config.startupFolderType) setStartupFolderType(config.startupFolderType);
        if (config.slideInterval) setSlideInterval(config.slideInterval);
        if (config.slideLoop !== undefined) setSlideLoop(config.slideLoop);
        if (config.viewMode) setViewMode(config.viewMode);
        if (config.readingDirection) setReadingDirection(config.readingDirection);
        if (config.firstPageIsCover !== undefined) setFirstPageIsCover(config.firstPageIsCover);
        if (config.language) setLanguage(config.language);
        if (config.theme) setTheme(config.theme);
        if (config.background) setBackground(config.background);
        if (config.everythingEnabled !== undefined) setEverythingEnabled(config.everythingEnabled);
        if (config.everythingMaxResults !== undefined) setEverythingMaxResults(config.everythingMaxResults);
        if (config.everythingCliPath !== undefined) setEverythingCliPath(config.everythingCliPath);

        setIsLoaded(true);
      } catch (e) {
        console.error("Failed to load settings:", e);
        setIsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  const saveSettings = useCallback(async (updates: any) => {
    try {
      const appDir = await appDataDir();
      if (!(await exists(appDir))) {
        await mkdir(appDir, { recursive: true });
      }
      const configPath = await join(appDir, "config.json");
      
      let currentConfig: any = {};
      if (await exists(configPath)) {
        const content = await readTextFile(configPath);
        currentConfig = JSON.parse(content);
      }

      const newConfig = {
        ...currentConfig,
        dataStoragePath,
        historyRetentionDays,
        startupFolderType,
        slideInterval,
        slideLoop,
        viewMode,
        readingDirection,
        firstPageIsCover,
        language,
        theme,
        background,
        everythingEnabled,
        everythingMaxResults,
        everythingCliPath,
        ...updates
      };

      await writeTextFile(configPath, JSON.stringify(newConfig, null, 2));
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  }, [dataStoragePath, historyRetentionDays, startupFolderType, slideInterval, slideLoop, viewMode, readingDirection, firstPageIsCover, language, theme, background, everythingEnabled, everythingMaxResults, everythingCliPath]);

  const updateEverythingCliPath = useCallback(async (path: string) => {
    setEverythingCliPath(path);
    await saveSettings({ everythingCliPath: path });
  }, [saveSettings]);

  const changeStoragePath = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "データ保存先フォルダを選択"
      });
      if (selected && typeof selected === 'string') {
        setDataStoragePath(selected);
        await saveSettings({ dataStoragePath: selected });
      }
    } catch (e) {
      console.error(e);
    }
  }, [saveSettings]);

  const updateHistoryRetention = useCallback(async (days: number) => {
    setHistoryRetentionDays(days);
    await saveSettings({ historyRetentionDays: days });
  }, [saveSettings]);

  const updateStartupFolderType = useCallback(async (type: StartupFolderType) => {
    setStartupFolderType(type);
    await saveSettings({ startupFolderType: type });
  }, [saveSettings]);

  const updateSlideInterval = useCallback(async (seconds: number) => {
    setSlideInterval(seconds);
    await saveSettings({ slideInterval: seconds });
  }, [saveSettings]);

  const toggleSlideLoop = useCallback(async () => {
    const newVal = !slideLoop;
    setSlideLoop(newVal);
    await saveSettings({ slideLoop: newVal });
  }, [slideLoop, saveSettings]);

  const updateViewMode = useCallback(async (mode: "single" | "spread") => {
    setViewMode(mode);
    await saveSettings({ viewMode: mode });
  }, [saveSettings]);

  const updateReadingDirection = useCallback(async (direction: "rtl" | "ltr") => {
    setReadingDirection(direction);
    await saveSettings({ readingDirection: direction });
  }, [saveSettings]);

  const toggleFirstPageIsCover = useCallback(async () => {
    const newVal = !firstPageIsCover;
    setFirstPageIsCover(newVal);
    await saveSettings({ firstPageIsCover: newVal });
  }, [firstPageIsCover, saveSettings]);

  const updateLanguage = useCallback(async (lang: string) => {
    setLanguage(lang);
    await saveSettings({ language: lang });
  }, [saveSettings]);

  const updateTheme = useCallback(async (newTheme: ThemeMode) => {
    setTheme(newTheme);
    await saveSettings({ theme: newTheme });
  }, [saveSettings]);

  const updateBackground = useCallback(async (updates: Partial<BackgroundSettings>) => {
    const newBg = { ...background, ...updates };
    setBackground(newBg);
    await saveSettings({ background: newBg });
  }, [background, saveSettings]);

  const updateEverythingEnabled = useCallback(async (enabled: boolean) => {
    setEverythingEnabled(enabled);
    await saveSettings({ everythingEnabled: enabled });
  }, [saveSettings]);

  const updateEverythingMaxResults = useCallback(async (count: number) => {
    const val = Math.max(1, Math.min(1000, count));
    setEverythingMaxResults(val);
    await saveSettings({ everythingMaxResults: val });
  }, [saveSettings]);

  const pickBackgroundImage = useCallback(async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png", "webp"] }]
      });
      if (selected && typeof selected === 'string') {
        updateBackground({ path: selected });
      }
    } catch (e) {
      console.error(e);
    }
  }, [updateBackground]);

  return {
    isLoaded,
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
    updateTheme,
    background,
    updateBackground,
    everythingEnabled,
    updateEverythingEnabled,
    everythingMaxResults,
    updateEverythingMaxResults,
    everythingCliPath,
    updateEverythingCliPath,
    pickBackgroundImage
  };
}
