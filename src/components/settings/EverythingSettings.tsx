import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

interface EverythingSettingsProps {
  everythingEnabled: boolean;
  everythingMaxResults: number;
  everythingCliPath: string;
  onUpdateEnabled: (enabled: boolean) => void;
  onUpdateMaxResults: (count: number) => void;
  onUpdateCliPath: (path: string) => void;
}

export function EverythingSettings({
  everythingEnabled,
  everythingMaxResults,
  everythingCliPath,
  onUpdateEnabled,
  onUpdateMaxResults,
  onUpdateCliPath
}: EverythingSettingsProps) {
  const { t } = useTranslation();
  const [isRunning, setIsRunning] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status: boolean = await invoke("check_everything_running");
        setIsRunning(status);
      } catch (e) {
        console.error("Failed to check Everything status:", e);
        setIsRunning(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePickCli = useCallback(async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Executable", extensions: ["exe"] }],
        title: t('settings.everything_cli_dialog_title')
      });
      if (selected && typeof selected === 'string') {
        onUpdateCliPath(selected);
      }
    } catch (e) {
      console.error(e);
    }
  }, [onUpdateCliPath]);

  return (
    <div className="settings-section">
      <h3>{t('settings.everything_title')}</h3>
      
      <div className="settings-group">
        <p className="settings-hint" style={{ marginBottom: '15px' }}>
          {t('settings.everything_desc')}
        </p>
      </div>

      <div className="settings-group">
        <label>{t('settings.everything_status')}</label>
        <div className={`status-indicator ${isRunning ? 'running' : 'stopped'}`}>
          <span className="status-dot"></span>
          {isRunning 
            ? t('settings.everything_status_running') 
            : t('settings.everything_status_stopped')}
        </div>
      </div>

      <div className="settings-group" style={{ marginTop: '20px', borderTop: '1px solid var(--border-main)', paddingTop: '20px' }}>
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={everythingEnabled} 
            onChange={(e) => onUpdateEnabled(e.target.checked)} 
          />
          {t('settings.everything_enable')}
        </label>
      </div>

      <div className="settings-group">
        <label>{t('settings.everything_limit')}</label>
        <input 
          type="number" 
          className="settings-input"
          min={1} 
          max={1000} 
          value={everythingMaxResults} 
          onChange={(e) => onUpdateMaxResults(parseInt(e.target.value) || 1)}
        />
      </div>

      <div className="settings-group">
        <label>{t('settings.everything_cli_label')}</label>
        <div className="path-input-group">
          <input 
            type="text" 
            value={everythingCliPath} 
            readOnly 
            placeholder={t('settings.everything_cli_placeholder')} 
          />
          <button className="settings-button" onClick={handlePickCli}>{t('settings.storage_change')}</button>
          <button className="settings-button" onClick={() => onUpdateCliPath("")}>{t('common.reset')}</button>
        </div>
        <p className="settings-hint" style={{ marginTop: '8px' }}>
          {t('settings.everything_cli_hint')}
        </p>
      </div>
    </div>
  );
}
