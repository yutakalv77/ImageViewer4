import { useTranslation } from "react-i18next";
import { StorageSettings } from "./settings/StorageSettings";
import { HistorySettings } from "./settings/HistorySettings";
import { GeneralSettings } from "./settings/GeneralSettings";
import { EverythingSettings } from "./settings/EverythingSettings";
import { BackgroundSettings, StartupFolderType, ThemeMode } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  activeTab: string;
  dataStoragePath: string;
  historyRetentionDays: number;
  startupFolderType: StartupFolderType;
  language: string;
  theme: ThemeMode;
  background: BackgroundSettings;
  everythingEnabled: boolean;
  everythingMaxResults: number;
  everythingCliPath: string;
  onClose: () => void;
  onTabChange: (tab: string) => void;
  onChangeStoragePath: () => void;
  onUpdateHistoryRetention: (days: number) => void;
  onUpdateStartupFolderType: (type: StartupFolderType) => void;
  onUpdateLanguage: (lang: string) => void;
  onUpdateTheme: (theme: ThemeMode) => void;
  onUpdateBackground: (updates: Partial<BackgroundSettings>) => void;
  onPickBackgroundImage: () => void;
  onUpdateEverythingEnabled: (enabled: boolean) => void;
  onUpdateEverythingMaxResults: (count: number) => void;
  onUpdateEverythingCliPath: (path: string) => void;
}

export function SettingsModal({
  isOpen,
  activeTab,
  dataStoragePath,
  historyRetentionDays,
  startupFolderType,
  language,
  theme,
  background,
  everythingEnabled,
  everythingMaxResults,
  everythingCliPath,
  onClose,
  onTabChange,
  onChangeStoragePath,
  onUpdateHistoryRetention,
  onUpdateStartupFolderType,
  onUpdateLanguage,
  onUpdateTheme,
  onUpdateBackground,
  onPickBackgroundImage,
  onUpdateEverythingEnabled,
  onUpdateEverythingMaxResults,
  onUpdateEverythingCliPath
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
              className={`settings-menu-item ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => onTabChange('general')}
            >
              {t('settings.tab_general')}
            </div>
            <div 
              className={`settings-menu-item ${activeTab === 'storage' ? 'active' : ''}`}
              onClick={() => onTabChange('storage')}
            >
              {t('settings.tab_storage')}
            </div>
            <div 
              className={`settings-menu-item ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => onTabChange('history')}
            >
              {t('settings.tab_history')}
            </div>
            <div 
              className={`settings-menu-item ${activeTab === 'everything' ? 'active' : ''}`}
              onClick={() => onTabChange('everything')}
            >
              {t('settings.tab_everything')}
            </div>
          </div>

          <div className="settings-content">
            {activeTab === 'general' && (
              <GeneralSettings 
                startupFolderType={startupFolderType}
                language={language}
                theme={theme}
                background={background}
                onUpdateStartupFolderType={onUpdateStartupFolderType}
                onUpdateLanguage={onUpdateLanguage}
                onUpdateTheme={onUpdateTheme}
                onUpdateBackground={onUpdateBackground}
                onPickBackgroundImage={onPickBackgroundImage}
              />
            )}
            {activeTab === 'storage' && (
              <StorageSettings 
                dataStoragePath={dataStoragePath}
                onChangeStoragePath={onChangeStoragePath}
              />
            )}
            {activeTab === 'history' && (
              <HistorySettings 
                historyRetentionDays={historyRetentionDays}
                onUpdateHistoryRetention={onUpdateHistoryRetention}
              />
            )}
            {activeTab === 'everything' && (
              <EverythingSettings 
                everythingEnabled={everythingEnabled}
                everythingMaxResults={everythingMaxResults}
                everythingCliPath={everythingCliPath}
                onUpdateEnabled={onUpdateEverythingEnabled}
                onUpdateMaxResults={onUpdateEverythingMaxResults}
                onUpdateCliPath={onUpdateEverythingCliPath}
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
