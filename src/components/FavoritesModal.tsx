import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FavoriteEntry } from "../types";
import { useFileSystemContext } from "../context/FileSystemContext";
import { useUIContext } from "../context/UIContext";
import "./FavoritesModal.css";

export function FavoritesModal() {
  const { t } = useTranslation();
  const { 
    favorites, updateAllFavorites, loadDirectory 
  } = useFileSystemContext();
  const { 
    isFavoritesOpen, setIsFavoritesOpen, setViewerState 
  } = useUIContext();

  const [tempFavorites, setTempFavorites] = useState<FavoriteEntry[]>([]);

  useEffect(() => {
    if (isFavoritesOpen) {
      setTempFavorites([...favorites]);
    }
  }, [isFavoritesOpen, favorites]);

  if (!isFavoritesOpen) return null;

  const onClose = () => setIsFavoritesOpen(false);

  const handleRemove = (path: string) => {
    setTempFavorites(prev => prev.filter(f => f.path !== path));
  };

  const handleNavigate = (path: string) => {
    setViewerState({ isOpen: false, currentIndex: -1 });
    loadDirectory(path);
    onClose();
  };

  const handleOk = () => {
    updateAllFavorites(tempFavorites);
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
                        onClick={() => handleNavigate(fav.path)}
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
