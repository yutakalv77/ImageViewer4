import { useTranslation } from "react-i18next";
import { StartupFolderType, ThemeMode } from "../types";
import { GeneralSettings } from "./settings/GeneralSettings";
import { HistorySettings } from "./settings/HistorySettings";
import { StorageSettings } from "./settings/StorageSettings";

interface SettingsModalProps {
  isOpen: boolean;
  activeTab: string;
  dataStoragePath: string;
  historyRetentionDays: number;
  startupFolderType: StartupFolderType;
  language: string;
  theme: ThemeMode;
  onClose: () => void;
  onTabChange: (tab: string) => void;
  onChangeStoragePath: () => void;
  onUpdateHistoryRetention: (days: number) => void;
  onUpdateStartupFolderType: (type: StartupFolderType) => void;
  onUpdateLanguage: (lang: string) => void;
  onUpdateTheme: (theme: ThemeMode) => void;
}

export function SettingsModal({
  isOpen,
  activeTab,
  dataStoragePath,
  historyRetentionDays,
  startupFolderType,
  language,
  theme,
  onClose,
  onTabChange,
  onChangeStoragePath,
  onUpdateHistoryRetention,
  onUpdateStartupFolderType,
  onUpdateLanguage,
  onUpdateTheme,
}: SettingsModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>{t('settings.title')}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="settings-body">
          <div className="settings-sidebar">
            <div 
              className={`settings-menu-item ${activeTab === "general" ? "active" : ""}`}
              onClick={() => onTabChange("general")}
            >
              {t('settings.tab_general')}
            </div>
            <div 
              className={`settings-menu-item ${activeTab === "history" ? "active" : ""}`}
              onClick={() => onTabChange("history")}
            >
              {t('settings.tab_history')}
            </div>
            <div 
              className={`settings-menu-item ${activeTab === "storage" ? "active" : ""}`}
              onClick={() => onTabChange("storage")}
            >
              {t('settings.tab_storage')}
            </div>
          </div>
          <div className="settings-content">
            {activeTab === "general" && (
              <GeneralSettings 
                startupFolderType={startupFolderType}
                language={language}
                theme={theme}
                onUpdateStartupFolderType={onUpdateStartupFolderType}
                onUpdateLanguage={onUpdateLanguage}
                onUpdateTheme={onUpdateTheme}
              />
            )}
            {activeTab === "history" && (
              <HistorySettings 
                historyRetentionDays={historyRetentionDays}
                onUpdateHistoryRetention={onUpdateHistoryRetention}
              />
            )}
            {activeTab === "storage" && (
              <StorageSettings 
                dataStoragePath={dataStoragePath}
                onChangeStoragePath={onChangeStoragePath}
              />
            )}
          </div>
        </div>
        <div className="settings-footer">
          <button className="settings-button primary" onClick={onClose}>{t('common.close')}</button>
        </div>
      </div>
    </div>
  );
}
