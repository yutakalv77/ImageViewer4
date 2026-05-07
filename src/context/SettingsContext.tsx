import React, { createContext, useContext } from "react";
import { useSettings } from "../hooks/useSettings";

type SettingsContextType = ReturnType<typeof useSettings>;

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const settings = useSettings();
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettingsContext must be used within a SettingsProvider");
  }
  return context;
};
