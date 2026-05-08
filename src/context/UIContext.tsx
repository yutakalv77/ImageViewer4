import React, { createContext, useContext, useState } from "react";
import { ViewerState } from "../types";

interface UIContextType {
  viewerState: ViewerState;
  setViewerState: React.Dispatch<React.SetStateAction<ViewerState>>;
  isFavoritesOpen: boolean;
  setIsFavoritesOpen: (open: boolean) => void;
  isIntervalDialogOpen: boolean;
  setIsIntervalDialogOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  activeSettingsTab: string;
  setActiveSettingsTab: (tab: string) => void;
  persistentError: string | null;
  setPersistentError: (error: string | null) => void;
  selectedInfoPath: string | null;
  setSelectedInfoPath: (path: string | null) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewerState, setViewerState] = useState<ViewerState>({ isOpen: false, currentIndex: -1 });
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isIntervalDialogOpen, setIsIntervalDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("general");
  const [persistentError, setPersistentError] = useState<string | null>(null);
  const [selectedInfoPath, setSelectedInfoPath] = useState<string | null>(null);

  return (
    <UIContext.Provider value={{
      viewerState,
      setViewerState,
      isFavoritesOpen,
      setIsFavoritesOpen,
      isIntervalDialogOpen,
      setIsIntervalDialogOpen,
      isSettingsOpen,
      setIsSettingsOpen,
      activeSettingsTab,
      setActiveSettingsTab,
      persistentError,
      setPersistentError,
      selectedInfoPath,
      setSelectedInfoPath
    }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUIContext = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useUIContext must be used within a UIProvider");
  }
  return context;
};
