import { useState, useEffect, useRef } from "react";

interface SlideIntervalModalProps {
  isOpen: boolean;
  currentInterval: number;
  onClose: () => void;
  onSave: (seconds: number) => void;
}

export function SlideIntervalModal({ isOpen, currentInterval, onClose, onSave }: SlideIntervalModalProps) {
  const [value, setValue] = useState(currentInterval.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(currentInterval.toString());
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, currentInterval]);

  if (!isOpen) return null;

  const handleOk = () => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      onSave(num);
    }
    onClose();
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal interval-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>表示間隔の設定</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="settings-body" style={{ padding: '40px' }}>
          <div className="settings-group">
            <label>表示間隔 (0.1 ～ 99.9 秒)</label>
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
              <span style={{ display: 'flex', alignItems: 'center', color: '#aaa' }}>秒</span>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button className="settings-button" onClick={onClose}>キャンセル</button>
          <button className="settings-button primary" onClick={handleOk}>OK</button>
        </div>
      </div>
    </div>
  );
}
