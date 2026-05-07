import { useTranslation } from "react-i18next";
import { StartupFolderType, ThemeMode, BackgroundSettings } from "../../types";

interface GeneralSettingsProps {
  startupFolderType: StartupFolderType;
  language: string;
  theme: ThemeMode;
  background: BackgroundSettings;
  onUpdateStartupFolderType: (type: StartupFolderType) => void;
  onUpdateLanguage: (lang: string) => void;
  onUpdateTheme: (theme: ThemeMode) => void;
  onUpdateBackground: (updates: Partial<BackgroundSettings>) => void;
  onPickBackgroundImage: () => void;
}

export function GeneralSettings({
  startupFolderType,
  language,
  theme,
  background,
  onUpdateStartupFolderType,
  onUpdateLanguage,
  onUpdateTheme,
  onUpdateBackground,
  onPickBackgroundImage
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
        <label>{t('settings.theme_label')}</label>
        <div className="path-input-group">
          <select 
            className="settings-select"
            value={theme} 
            onChange={(e) => onUpdateTheme(e.target.value as ThemeMode)}
          >
            <option value="dark">{t('settings.theme_dark')}</option>
            <option value="light">{t('settings.theme_light')}</option>
            <option value="system">{t('settings.theme_system')}</option>
          </select>
        </div>
      </div>

      <div className="settings-group" style={{ marginTop: '20px' }}>
        <label>{t('settings.language_label')}</label>
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

      <div className="settings-group" style={{ marginTop: '30px', borderTop: '1px solid var(--border-main)', paddingTop: '20px' }}>
        <label>{t('settings.bg_title')}</label>
        <div className="path-input-group" style={{ marginBottom: '10px' }}>
          <input type="text" value={background.path || ""} readOnly placeholder={t('settings.bg_label')} />
          <button className="settings-button" onClick={onPickBackgroundImage}>{t('settings.storage_change')}</button>
          <button className="settings-button" onClick={() => onUpdateBackground({ path: null })}>{t('common.reset')}</button>
        </div>

        {background.path && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
              <div className="settings-group">
                <label>{t('settings.bg_opacity')}: {Math.round(background.opacity * 100)}%</label>
                <input 
                  type="range" min="0" max="1" step="0.05" 
                  value={background.opacity} 
                  onChange={(e) => onUpdateBackground({ opacity: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div className="settings-group">
                <label>{t('settings.bg_blur')}: {background.blur}px</label>
                <input 
                  type="range" min="0" max="20" step="1" 
                  value={background.blur} 
                  onChange={(e) => onUpdateBackground({ blur: parseInt(e.target.value, 10) })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div className="settings-group">
              <label>{t('settings.bg_style')}</label>
              <div className="path-input-group">
                <select 
                  className="settings-select"
                  value={background.style} 
                  onChange={(e) => onUpdateBackground({ style: e.target.value as any })}
                >
                  <option value="cover">{t('settings.bg_style_cover')}</option>
                  <option value="contain">{t('settings.bg_style_contain')}</option>
                  <option value="tile">{t('settings.bg_style_tile')}</option>
                </select>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
