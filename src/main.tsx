import React from "react";
import ReactDOM from "react-dom/client";
import "./i18n";
import App from "./App";
import { SettingsProvider } from "./context/SettingsContext";
import { FileSystemProvider } from "./context/FileSystemContext";
import { UIProvider } from "./context/UIContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <SettingsProvider>
      <FileSystemProvider>
        <UIProvider>
          <App />
        </UIProvider>
      </FileSystemProvider>
    </SettingsProvider>
  </React.StrictMode>,
);
