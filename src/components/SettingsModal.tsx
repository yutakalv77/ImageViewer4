interface SettingsModalProps {
  isOpen: boolean;
  activeTab: string;
  dataStoragePath: string;
  historyRetentionDays: number;
  startupFolderType: string;
  onClose: () => void;
  onTabChange: (tab: string) => void;
  onChangeStoragePath: () => void;
  onUpdateHistoryRetention: (days: number) => void;
  onUpdateStartupFolderType: (type: string) => void;
}

export function SettingsModal({
  isOpen,
  activeTab,
  dataStoragePath,
  historyRetentionDays,
  startupFolderType,
  onClose,
  onTabChange,
  onChangeStoragePath,
  onUpdateHistoryRetention,
  onUpdateStartupFolderType,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>設定</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="settings-body">
          <div className="settings-sidebar">
            <div 
              className={`settings-menu-item ${activeTab === "storage" ? "active" : ""}`}
              onClick={() => onTabChange("storage")}
            >
              データ保存
            </div>
            <div 
              className={`settings-menu-item ${activeTab === "history" ? "active" : ""}`}
              onClick={() => onTabChange("history")}
            >
              履歴
            </div>
            <div 
              className={`settings-menu-item ${activeTab === "general" ? "active" : ""}`}
              onClick={() => onTabChange("general")}
            >
              一般
            </div>
          </div>
          <div className="settings-content">
            {activeTab === "storage" && (
              <div className="settings-section">
                <h3>データ保存の設定</h3>
                <div className="settings-group">
                  <label>お気に入り・履歴データの保存先</label>
                  <div className="path-input-group">
                    <input type="text" value={dataStoragePath} readOnly />
                    <button className="settings-button" onClick={onChangeStoragePath}>変更...</button>
                  </div>
                  <p style={{fontSize: '0.8em', color: '#888', marginTop: '10px'}}>
                    ※お気に入りや閲覧履歴などの情報は、このフォルダ内に保存されます。
                  </p>
                </div>
              </div>
            )}
            {activeTab === "history" && (
              <div className="settings-section">
                <h3>履歴の設定</h3>
                <div className="settings-group">
                  <label>履歴の保存期間 (日)</label>
                  <div className="path-input-group">
                    <input 
                      type="number" 
                      min="0" 
                      max="1000" 
                      value={historyRetentionDays} 
                      onChange={(e) => onUpdateHistoryRetention(parseInt(e.target.value, 10) || 0)}
                    />
                  </div>
                  <p style={{fontSize: '0.8em', color: '#888', marginTop: '10px'}}>
                    ※0日に設定すると履歴を保存しません。最大1000日まで設定可能です。
                  </p>
                </div>
              </div>
            )}
            {activeTab === "general" && (
              <div className="settings-section">
                <h3>一般設定</h3>
                <div className="settings-group">
                  <label>起動時にフォルダ</label>
                  <div className="path-input-group">
                    <select 
                      className="settings-select"
                      value={startupFolderType} 
                      onChange={(e) => onUpdateStartupFolderType(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#1a1a1a',
                        border: '1px solid #444',
                        color: '#eee',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        fontSize: '0.9em'
                      }}
                    >
                      <option value="none">（なし）</option>
                      <option value="last">最後に表示したフォルダ</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="settings-footer">
          <button className="settings-button primary" onClick={onClose}>閉じる</button>
        </div>
      </div>
    </div>
  );
}
