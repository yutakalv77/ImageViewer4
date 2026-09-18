import { useTranslation } from "react-i18next";
import { useUIContext } from "../context/UIContext";
import { SETTINGS_TABS, getSettingsTabById, getDefaultSettingsTab } from "./settings/settingsRegistry";
import { useDraggableModal } from "../hooks/useDraggableModal";
import "./SettingsModal.css";

export function SettingsModal() {
  const { t } = useTranslation();
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    activeSettingsTab,
    setActiveSettingsTab,
  } = useUIContext();

  const { pos, size, handleMouseDown, handleResizeStart } = useDraggableModal({
    isOpen: isSettingsOpen,
  });

  if (!isSettingsOpen) return null;

  const onClose = () => setIsSettingsOpen(false);
  const currentTab = getSettingsTabById(activeSettingsTab) ?? getDefaultSettingsTab();
  const ActiveComponent = currentTab.Component;

  return (
    <div className="settings-window-overlay">
      <div
        className="settings-modal draggable-window"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: `${size.w}px`,
          height: `${size.h}px`,
          position: "fixed",
          margin: 0,
        }}
      >
        <div className="settings-header window-title-bar" onMouseDown={handleMouseDown}>
          <h2>{t("settings.title")}</h2>
          <button
            className="close-button"
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label="Close"
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M0 0l10 10M10 0L0 10" stroke="currentColor" strokeWidth="1.2" fill="none" />
            </svg>
          </button>
        </div>

        <div className="settings-body">
          <nav className="settings-sidebar" aria-label="Settings categories">
            {SETTINGS_TABS.map((tab) => (
              <div
                key={tab.id}
                role="button"
                tabIndex={0}
                className={`settings-menu-item ${currentTab.id === tab.id ? "active" : ""}`}
                onClick={() => setActiveSettingsTab(tab.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveSettingsTab(tab.id);
                  }
                }}
              >
                {tab.icon && <span className="settings-menu-icon">{tab.icon}</span>}
                {t(tab.labelKey)}
              </div>
            ))}
          </nav>

          <main className="settings-content">
            <ActiveComponent />
          </main>
        </div>

        <div className="settings-footer">
          <button className="settings-button primary" onClick={onClose}>
            {t("common.close")}
          </button>
        </div>

        {/* Window Resize Handles */}
        <div className="win-resize-handle e" onMouseDown={(e) => handleResizeStart(e, "e")}></div>
        <div className="win-resize-handle s" onMouseDown={(e) => handleResizeStart(e, "s")}></div>
        <div className="win-resize-handle se" onMouseDown={(e) => handleResizeStart(e, "se")}></div>
      </div>
    </div>
  );
}
