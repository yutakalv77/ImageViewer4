import React, { createContext, useContext, useState, useCallback } from "react";
import { ViewerState } from "../types";
import { useImageTransform } from "../hooks/useImageTransform";
import { ImageTransform } from "../utils/transformUtils";

export interface ZoomControls {
  zoomActualSize: () => void;
  zoomFit: () => void;
  isZoomed: boolean;
}

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
  imageTransform: ImageTransform;
  isTransformed: boolean;
  transformCount: number;
  rotateClockwise: () => void;
  rotateCounterClockwise: () => void;
  toggleFlipH: () => void;
  toggleFlipV: () => void;
  resetTransform: () => void;
  zoomControls: ZoomControls | null;
  registerZoomControls: (controls: ZoomControls | null) => void;
  zoomActualSize: () => void;
  zoomFit: () => void;
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
  const transform = useImageTransform();
  const [zoomControls, setZoomControls] = useState<ZoomControls | null>(null);

  const registerZoomControls = useCallback((controls: ZoomControls | null) => {
    setZoomControls(controls);
  }, []);

  const zoomActualSize = useCallback(() => {
    zoomControls?.zoomActualSize();
  }, [zoomControls]);

  const zoomFit = useCallback(() => {
    zoomControls?.zoomFit();
  }, [zoomControls]);

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
      setSelectedInfoPath,
      imageTransform: transform.transform,
      isTransformed: transform.isTransformed,
      transformCount: transform.transformCount,
      rotateClockwise: transform.rotateClockwise,
      rotateCounterClockwise: transform.rotateCounterClockwise,
      toggleFlipH: transform.toggleFlipH,
      toggleFlipV: transform.toggleFlipV,
      resetTransform: transform.resetTransform,
      zoomControls,
      registerZoomControls,
      zoomActualSize,
      zoomFit,
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

export const useOptionalUIContext = () => {
  return useContext(UIContext);
};
