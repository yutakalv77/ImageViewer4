import { useTranslation } from "react-i18next";

interface StorageSettingsProps {
  dataStoragePath: string;
  onChangeStoragePath: () => void;
}

export function StorageSettings({
  dataStoragePath,
  onChangeStoragePath
}: StorageSettingsProps) {
  const { t } = useTranslation();

  return (
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
  );
}
