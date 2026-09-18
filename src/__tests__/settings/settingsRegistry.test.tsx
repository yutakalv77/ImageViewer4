import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  SETTINGS_TABS,
  getSettingsTabById,
  getDefaultSettingsTab,
  GeneralTabPanel,
  StorageTabPanel,
  HistoryTabPanel,
  EverythingTabPanel,
} from "../../components/settings/settingsRegistry";

// SettingsContextのモック
vi.mock("../../context/SettingsContext", () => ({
  useSettingsContext: () => ({
    startupFolderType: "none",
    updateStartupFolderType: vi.fn(),
    language: "ja",
    updateLanguage: vi.fn(),
    theme: "dark",
    updateTheme: vi.fn(),
    background: { path: null, opacity: 0.3, blur: 5, style: "cover" },
    updateBackground: vi.fn(),
    pickBackgroundImage: vi.fn(),
    pageNumberPosition: "bottom-center",
    updatePageNumberPosition: vi.fn(),
    highPerformanceMode: false,
    updateHighPerformanceMode: vi.fn(),
    confirmDelete: true,
    updateConfirmDelete: vi.fn(),
    dataStoragePath: "C:/app_data",
    changeStoragePath: vi.fn(),
    historyRetentionDays: 30,
    updateHistoryRetention: vi.fn(),
    everythingEnabled: false,
    updateEverythingEnabled: vi.fn(),
    everythingMaxResults: 100,
    updateEverythingMaxResults: vi.fn(),
    everythingCliPath: "",
    updateEverythingCliPath: vi.fn(),
  }),
}));

// react-i18nextのモック
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("settingsRegistry", () => {
  it("タブレジストリに4つの基本設定タブが登録されていること", () => {
    expect(SETTINGS_TABS).toHaveLength(4);
    expect(SETTINGS_TABS.map((t) => t.id)).toEqual([
      "general",
      "storage",
      "history",
      "everything",
    ]);
  });

  it("getSettingsTabByIdで存在するタブが取得でき、存在しない場合はundefinedが返ること", () => {
    const generalTab = getSettingsTabById("general");
    expect(generalTab).toBeDefined();
    expect(generalTab?.labelKey).toBe("settings.tab_general");

    const unknownTab = getSettingsTabById("non_existent_tab");
    expect(unknownTab).toBeUndefined();
  });

  it("getDefaultSettingsTabで最初のタブ（general）が取得できること", () => {
    const defaultTab = getDefaultSettingsTab();
    expect(defaultTab.id).toBe("general");
  });

  it("各タブパネルコンポーネントが正常に描画されること", () => {
    const { unmount: unmount1 } = render(<GeneralTabPanel />);
    expect(screen.getByText("settings.general_title")).toBeInTheDocument();
    unmount1();

    const { unmount: unmount2 } = render(<StorageTabPanel />);
    expect(screen.getByText("settings.storage_title")).toBeInTheDocument();
    unmount2();

    const { unmount: unmount3 } = render(<HistoryTabPanel />);
    expect(screen.getByText("settings.history_title")).toBeInTheDocument();
    unmount3();

    const { unmount: unmount4 } = render(<EverythingTabPanel />);
    expect(screen.getByText("settings.everything_title")).toBeInTheDocument();
    unmount4();
  });
});
