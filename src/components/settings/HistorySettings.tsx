import { useTranslation } from "react-i18next";

interface HistorySettingsProps {
  historyRetentionDays: number;
  onUpdateHistoryRetention: (days: number) => void;
}

export function HistorySettings({
  historyRetentionDays,
  onUpdateHistoryRetention
}: HistorySettingsProps) {
  const { t } = useTranslation();

  return (
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
  );
}
