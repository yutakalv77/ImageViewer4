import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSettingsContext } from "../context/SettingsContext";
import { useUIContext } from "../context/UIContext";
import "./SlideIntervalModal.css";

export function SlideIntervalModal() {
  const { t } = useTranslation();
  const { slideInterval, updateSlideInterval } = useSettingsContext();
  const { isIntervalDialogOpen, setIsIntervalDialogOpen } = useUIContext();

  const [value, setValue] = useState(slideInterval.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isIntervalDialogOpen) {
      setValue(slideInterval.toString());
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isIntervalDialogOpen, slideInterval]);

  if (!isIntervalDialogOpen) return null;

  const onClose = () => setIsIntervalDialogOpen(false);

  const handleOk = () => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      updateSlideInterval(num);
    }
    onClose();
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal interval-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>{t('slideshow.interval_dialog_title')}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="settings-body" style={{ padding: '40px' }}>
          <div className="settings-group">
            <label>{t('slideshow.interval_label')}</label>
            <div className="path-input-group">
              <input 
                ref={inputRef}
                type="number" 
                step="0.1"
                min="0.1"
                max="99.9"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleOk()}
              />
              <span style={{ display: 'flex', alignItems: 'center', color: '#aaa' }}>{t('slide_menu.interval_unit')}</span>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button className="settings-button" onClick={onClose}>{t('common.cancel')}</button>
          <button className="settings-button primary" onClick={handleOk}>{t('common.ok')}</button>
        </div>
      </div>
    </div>
  );
}
