import { useTranslation } from "react-i18next";

interface SettingsModalProps {
  isOpen: boolean;
  activeTab: string;
  dataStoragePath: string;
  historyRetentionDays: number;
  startupFolderType: string;
  language: string;
  theme: string;
  onClose: () => void;
  onTabChange: (tab: string) => void;
  onChangeStoragePath: () => void;
  onUpdateHistoryRetention: (days: number) => void;
  onUpdateStartupFolderType: (type: string) => void;
  onUpdateLanguage: (lang: string) => void;
  onUpdateTheme: (theme: string) => void;
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
              <div className="settings-section">
                <h3>{t('settings.general_title')}</h3>
                <div className="settings-group">
                  <label>{t('settings.startup_folder_label')}</label>
                  <div className="path-input-group">
                    <select 
                      className="settings-select"
                      value={startupFolderType} 
                      onChange={(e) => onUpdateStartupFolderType(e.target.value)}
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
                      onChange={(e) => onUpdateTheme(e.target.value)}
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
            )}
            {activeTab === "history" && (
              <div className="settings-section">
                <h3>{t('settings.history_title')}</h3>
                <div className="settings-group">
                  <label>{t('settings.history_label')}</label>
                  <div className="path-input-group">
                    <input 
                      type="number" 
                      min="0" 
                      max="1000" 
                      value={historyRetentionDays} 
                      onChange={(e) => onUpdateHistoryRetention(parseInt(e.target.value, 10) || 0)}
                    />
                  </div>
                  <p style={{fontSize: '0.8em', color: 'var(--text-dim)', marginTop: '10px'}}>
                    {t('settings.history_hint')}
                  </p>
                </div>
              </div>
            )}
            {activeTab === "storage" && (
              <div className="settings-section">
                <h3>{t('settings.storage_title')}</h3>
                <div className="settings-group">
                  <label>{t('settings.storage_label')}</label>
                  <div className="path-input-group">
                    <input type="text" value={dataStoragePath} readOnly />
                    <button className="settings-button" onClick={onChangeStoragePath}>{t('settings.storage_change')}</button>
                  </div>
                  <p style={{fontSize: '0.8em', color: 'var(--text-dim)', marginTop: '10px'}}>
                    {t('settings.storage_hint')}
                  </p>
                </div>
              </div>
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
