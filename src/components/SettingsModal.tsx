interface SettingsModalProps {
  isOpen: boolean;
  activeTab: string;
  dataStoragePath: string;
  onClose: () => void;
  onTabChange: (tab: string) => void;
  onChangeStoragePath: () => void;
}

export function SettingsModal({
  isOpen,
  activeTab,
  dataStoragePath,
  onClose,
  onTabChange,
  onChangeStoragePath,
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
            {activeTab === "general" && (
              <div className="settings-section">
                <h3>一般設定</h3>
                <p>今後のアップデートで機能が追加される予定です。</p>
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
