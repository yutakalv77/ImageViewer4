import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useFileSystem } from "../hooks/useFileSystem";
import { useHistory } from "../hooks/useHistory";
import { useFavorites } from "../hooks/useFavorites";
import { useSettingsContext } from "./SettingsContext";
import { EntryItem } from "../types";
import { VIRTUAL_PATH_FAVORITES, convertFavoriteToEntry } from "../utils/virtualPathUtils";

type FileSystemContextType = ReturnType<typeof useFileSystem> & {
  history: ReturnType<typeof useHistory>["history"];
  recordHistory: ReturnType<typeof useHistory>["recordHistory"];
  isHistoryLoaded: boolean;
  favorites: ReturnType<typeof useFavorites>["favorites"];
  isFavorite: ReturnType<typeof useFavorites>["isFavorite"];
  toggleFavorite: ReturnType<typeof useFavorites>["toggleFavorite"];
  updateAllFavorites: ReturnType<typeof useFavorites>["updateAllFavorites"];
  displayEntries: EntryItem[];
  images: EntryItem[];
};

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

export const FileSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { dataStoragePath, historyRetentionDays } = useSettingsContext();
  const fs = useFileSystem();
  const { history, recordHistory, isLoaded: isHistoryLoaded } = useHistory(dataStoragePath, historyRetentionDays);
  const { favorites, isFavorite, toggleFavorite, updateAllFavorites } = useFavorites(dataStoragePath);

  const images = useMemo(() => fs.entries.filter(e => !e.is_dir), [fs.entries]);

  const displayEntries = useMemo(() => {
    if (fs.currentPath === VIRTUAL_PATH_FAVORITES) {
      return favorites.map(convertFavoriteToEntry);
    }
    return fs.entries;
  }, [fs.currentPath, fs.entries, favorites]);

  const value = {
    ...fs,
    history,
    recordHistory,
    isHistoryLoaded,
    favorites,
    isFavorite,
    toggleFavorite,
    updateAllFavorites,
    displayEntries,
    images
  };

  return (
    <FileSystemContext.Provider value={value}>
      {children}
    </FileSystemContext.Provider>
  );
};

export const useFileSystemContext = () => {
  const context = useContext(FileSystemContext);
  if (context === undefined) {
    throw new Error("useFileSystemContext must be used within a FileSystemProvider");
  }
  return context;
};
