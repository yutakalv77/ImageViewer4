import { useTranslation } from "react-i18next";
import { useUIContext } from "../context/UIContext";
import { SETTINGS_TABS, getSettingsTabById, getDefaultSettingsTab } from "./settings/settingsRegistry";
import { SettingButton } from "./settings/primitives";
import { ModalWindow } from "./ModalWindow";
import "./SettingsModal.css";

export function SettingsModal() {
  const { t } = useTranslation();
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    activeSettingsTab,
    setActiveSettingsTab,
  } = useUIContext();

  if (!isSettingsOpen) return null;

  const onClose = () => setIsSettingsOpen(false);
  const currentTab = getSettingsTabById(activeSettingsTab) ?? getDefaultSettingsTab();
  const ActiveComponent = currentTab.Component;

  return (
    <ModalWindow
      isOpen={isSettingsOpen}
      onClose={onClose}
      title={t("settings.title")}
      footer={
        <SettingButton variant="primary" onClick={onClose}>
          {t("common.close")}
        </SettingButton>
      }
    >
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
    </ModalWindow>
  );
}
