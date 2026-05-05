import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

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
          <h2>{t('favorites.title')}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="settings-body">
          <div className="favorites-list-container">
            {tempFavorites.length > 0 ? (
              <table className="favorites-table">
                <thead>
                  <tr>
                    <th>{t('common.path')}</th>
                    <th>{t('common.date')}</th>
                    <th>{t('common.operation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {tempFavorites.map((fav) => (
                    <tr key={fav.path}>
                      <td 
                        className="fav-path" 
                        onClick={() => { onNavigate(fav.path); onClose(); }}
                        title={t('favorites.reveal_hint')}
                      >
                        {fav.path}
                      </td>
                      <td className="fav-date">
                        {new Date(fav.addedAt).toLocaleString()}
                      </td>
                      <td>
                        <button className="fav-remove-btn" onClick={() => handleRemove(fav.path)}>{t('common.delete')}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-msg">{t('favorites.empty')}</div>
            )}
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
