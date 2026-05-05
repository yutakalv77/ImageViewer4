import { useState, useEffect } from "react";
import { FavoriteEntry } from "../types";

interface FavoritesModalProps {
  isOpen: boolean;
  favorites: FavoriteEntry[];
  onClose: () => void;
  onSave: (newFavorites: FavoriteEntry[]) => void;
  onNavigate: (path: string) => void;
}

export function FavoritesModal({ isOpen, favorites, onClose, onSave, onNavigate }: FavoritesModalProps) {
  const [tempFavorites, setTempFavorites] = useState<FavoriteEntry[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTempFavorites([...favorites]);
    }
  }, [isOpen, favorites]);

  if (!isOpen) return null;

  const handleRemove = (path: string) => {
    setTempFavorites(prev => prev.filter(f => f.path !== path));
  };

  const handleOk = () => {
    onSave(tempFavorites);
    onClose();
  };

  return (
    <div className="settings-overlay favorites-overlay" onClick={onClose}>
      <div className="settings-modal favorites-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>お気に入り管理</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="settings-body">
          <div className="favorites-list-container">
            {tempFavorites.length > 0 ? (
              <table className="favorites-table">
                <thead>
                  <tr>
                    <th>パス</th>
                    <th>登録日時</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {tempFavorites.map((fav) => (
                    <tr key={fav.path}>
                      <td 
                        className="fav-path" 
                        onClick={() => { onNavigate(fav.path); onClose(); }}
                        title="このフォルダへ移動"
                      >
                        {fav.path}
                      </td>
                      <td className="fav-date">
                        {new Date(fav.addedAt).toLocaleString()}
                      </td>
                      <td>
                        <button className="fav-remove-btn" onClick={() => handleRemove(fav.path)}>削除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-msg">お気に入りは登録されていません</div>
            )}
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
