import React from "react";
import ReactDOM from "react-dom/client";
import "./i18n";
import App from "./App";
import { SettingsProvider } from "./context/SettingsContext";
import { FileSystemProvider } from "./context/FileSystemContext";
import { UIProvider } from "./context/UIContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Global error handlers for uncaught promise rejections and window errors
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

window.addEventListener("error", (event) => {
  console.error("Global window error:", event.error || event.message);
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SettingsProvider>
        <FileSystemProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </FileSystemProvider>
      </SettingsProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

