import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useFileSystem } from "../hooks/useFileSystem";
import { useHistory } from "../hooks/useHistory";
import { useFavorites } from "../hooks/useFavorites";
import { useFileOperations } from "../hooks/useFileOperations";
import { open } from "@tauri-apps/plugin-dialog";
import { useTranslation } from "react-i18next";
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
  renameEntry: (oldPath: string, newName: string, currentPath: string) => Promise<void>;
  openFolderDialog: () => Promise<void>;
};

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

export const FileSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { dataStoragePath, historyRetentionDays } = useSettingsContext();
  const fs = useFileSystem();
  const { history, recordHistory, isLoaded: isHistoryLoaded } = useHistory(dataStoragePath, historyRetentionDays);
  const { favorites, isFavorite, toggleFavorite, updateAllFavorites } = useFavorites(dataStoragePath);
  const { renameEntry } = useFileOperations(fs.loadDirectory);

  const { t } = useTranslation();
  const openFolderDialog = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: t('file_menu.open_folder')
      });
      if (selected && typeof selected === 'string') {
        fs.loadDirectory(selected);
      }
    } catch (e: any) {
      console.error(e);
    }
  }, [fs.loadDirectory, t]);

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
    images,
    renameEntry,
    openFolderDialog
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
