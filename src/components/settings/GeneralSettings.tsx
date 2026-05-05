import { useTranslation } from "react-i18next";
import { StartupFolderType, ThemeMode } from "../../types";

interface GeneralSettingsProps {
  startupFolderType: StartupFolderType;
  language: string;
  theme: ThemeMode;
  onUpdateStartupFolderType: (type: StartupFolderType) => void;
  onUpdateLanguage: (lang: string) => void;
  onUpdateTheme: (theme: ThemeMode) => void;
}

export function GeneralSettings({
  startupFolderType,
  language,
  theme,
  onUpdateStartupFolderType,
  onUpdateLanguage,
  onUpdateTheme
}: GeneralSettingsProps) {
  const { t } = useTranslation();

  return (
    <div className="settings-section">
      <h3>{t('settings.general_title')}</h3>
      <div className="settings-group">
        <label>{t('settings.startup_folder_label')}</label>
        <div className="path-input-group">
          <select 
            className="settings-select"
            value={startupFolderType} 
            onChange={(e) => onUpdateStartupFolderType(e.target.value as StartupFolderType)}
          >
            <option value="none">{t('settings.startup_none')}</option>
            <option value="last">{t('settings.startup_last')}</option>
          </select>
        </div>
      </div>

      <div className="settings-group" style={{ marginTop: '20px' }}>
        <label>{t('settings.theme_label', 'テーマ / Theme')}</label>
        <div className="path-input-group">
          <select 
            className="settings-select"
            value={theme} 
            onChange={(e) => onUpdateTheme(e.target.value as ThemeMode)}
          >
            <option value="dark">{t('settings.theme_dark', 'ダーク (Dark)')}</option>
            <option value="light">{t('settings.theme_light', 'ライト (Light)')}</option>
            <option value="system">{t('settings.theme_system', 'システム設定に準拠 (System)')}</option>
          </select>
        </div>
      </div>

      <div className="settings-group" style={{ marginTop: '20px' }}>
        <label>{t('settings.language_label', '言語 / Language')}</label>
        <div className="path-input-group">
          <select 
            className="settings-select"
            value={language} 
            onChange={(e) => onUpdateLanguage(e.target.value)}
          >
            <option value="ja">日本語 (Japanese)</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
    </div>
  );
}
