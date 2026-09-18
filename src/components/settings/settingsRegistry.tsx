import type { ReactNode, ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { useSettingsContext } from "../../context/SettingsContext";
import { useEverythingStatus } from "../../hooks/useEverythingStatus";
import { GeneralSettings } from "./GeneralSettings";
import { StorageSettings } from "./StorageSettings";
import { HistorySettings } from "./HistorySettings";
import { EverythingSettings } from "./EverythingSettings";

export interface SettingsTabItem {
  id: string;
  labelKey: string;
  icon?: ReactNode;
  Component: ComponentType;
}

/**
 * 一般設定タブのパネルコンポーネント（SettingsContextとGeneralSettingsを仲介）
 */
export function GeneralTabPanel() {
  const {
    startupFolderType, updateStartupFolderType,
    language, updateLanguage,
    theme, updateTheme,
    background, updateBackground, pickBackgroundImage,
    pageNumberPosition, updatePageNumberPosition,
    highPerformanceMode, updateHighPerformanceMode,
    confirmDelete, updateConfirmDelete,
  } = useSettingsContext();

  return (
    <GeneralSettings
      startupFolderType={startupFolderType}
      language={language}
      theme={theme}
      background={background}
      pageNumberPosition={pageNumberPosition}
      highPerformanceMode={highPerformanceMode}
      confirmDelete={confirmDelete}
      onUpdateStartupFolderType={updateStartupFolderType}
      onUpdateLanguage={updateLanguage}
      onUpdateTheme={updateTheme}
      onUpdateBackground={updateBackground}
      onPickBackgroundImage={pickBackgroundImage}
      onUpdatePageNumberPosition={updatePageNumberPosition}
      onUpdateHighPerformanceMode={updateHighPerformanceMode}
      onUpdateConfirmDelete={updateConfirmDelete}
    />
  );
}

/**
 * ストレージ設定タブのパネルコンポーネント
 */
export function StorageTabPanel() {
  const { dataStoragePath, changeStoragePath } = useSettingsContext();
  return (
    <StorageSettings
      dataStoragePath={dataStoragePath}
      onChangeStoragePath={changeStoragePath}
    />
  );
}

/**
 * 履歴設定タブのパネルコンポーネント
 */
export function HistoryTabPanel() {
  const { historyRetentionDays, updateHistoryRetention } = useSettingsContext();
  return (
    <HistorySettings
      historyRetentionDays={historyRetentionDays}
      onUpdateHistoryRetention={updateHistoryRetention}
    />
  );
}

/**
 * Everything検索設定タブのパネルコンポーネント
 */
export function EverythingTabPanel() {
  const { t } = useTranslation();
  const {
    everythingEnabled, updateEverythingEnabled,
    everythingMaxResults, updateEverythingMaxResults,
    everythingCliPath, updateEverythingCliPath,
  } = useSettingsContext();
  const { isRunning, pickCliPath } = useEverythingStatus();

  const handlePickCli = async () => {
    const selected = await pickCliPath(t("settings.everything_cli_dialog_title"));
    if (selected) {
      updateEverythingCliPath(selected);
    }
  };

  return (
    <EverythingSettings
      everythingEnabled={everythingEnabled}
      everythingMaxResults={everythingMaxResults}
      everythingCliPath={everythingCliPath}
      isRunning={isRunning}
      onUpdateEnabled={updateEverythingEnabled}
      onUpdateMaxResults={updateEverythingMaxResults}
      onUpdateCliPath={updateEverythingCliPath}
      onPickCliPath={handlePickCli}
    />
  );
}

/**
 * 設定画面のタブレジストリ一覧
 * 新しい設定タブを追加する場合はここにエントリを追加します。
 */
export const SETTINGS_TABS: SettingsTabItem[] = [
  { id: "general", labelKey: "settings.tab_general", Component: GeneralTabPanel },
  { id: "storage", labelKey: "settings.tab_storage", Component: StorageTabPanel },
  { id: "history", labelKey: "settings.tab_history", Component: HistoryTabPanel },
  { id: "everything", labelKey: "settings.tab_everything", Component: EverythingTabPanel },
];

/**
 * 指定されたタブIDに対応するタブレジストリエントリを取得する純粋関数
 */
export function getSettingsTabById(id: string): SettingsTabItem | undefined {
  return SETTINGS_TABS.find((tab) => tab.id === id);
}

/**
 * デフォルトの設定タブ（最初のタブ）を取得する純粋関数
 */
export function getDefaultSettingsTab(): SettingsTabItem {
  return SETTINGS_TABS[0];
}
