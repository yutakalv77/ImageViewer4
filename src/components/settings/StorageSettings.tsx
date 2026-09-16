import { useTranslation } from "react-i18next";
import { formatBytes } from "../../utils/formatUtils";
import { useThumbnailCache } from "../../hooks/useThumbnailCache";

interface StorageSettingsProps {
  dataStoragePath: string;
  onChangeStoragePath: () => void;
}

export function StorageSettings({
  dataStoragePath,
  onChangeStoragePath
}: StorageSettingsProps) {
  const { t } = useTranslation();
  const { cacheSize, isClearing, clearCache } = useThumbnailCache();

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

      <div className="settings-group" style={{ marginTop: '30px', borderTop: '1px solid var(--border-main)', paddingTop: '20px' }}>
        <label>{t('settings.cache_title')}</label>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
          <div>
            <span style={{ fontSize: '0.9em', color: 'var(--text-dim)' }}>
              {t('settings.cache_size_label')}:{" "}
            </span>
            <span style={{ fontWeight: 'bold', marginLeft: '5px' }}>
              {cacheSize === null ? t('settings.cache_size_loading') : formatBytes(cacheSize)}
            </span>
          </div>
          <button 
            className="settings-button" 
            onClick={clearCache}
            disabled={isClearing}
          >
            {t('settings.cache_clear_button')}
          </button>
        </div>
      </div>
    </div>
  );
}
