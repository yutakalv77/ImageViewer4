import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import {
  SettingSection,
  SettingRow,
  SettingToggle,
  SettingNumberInput,
  SettingPathInput,
} from "./primitives";

interface EverythingSettingsProps {
  everythingEnabled: boolean;
  everythingMaxResults: number;
  everythingCliPath: string;
  onUpdateEnabled: (enabled: boolean) => void;
  onUpdateMaxResults: (count: number) => void;
  onUpdateCliPath: (path: string) => void;
}

export function EverythingSettings({
  everythingEnabled,
  everythingMaxResults,
  everythingCliPath,
  onUpdateEnabled,
  onUpdateMaxResults,
  onUpdateCliPath,
}: EverythingSettingsProps) {
  const { t } = useTranslation();
  const [isRunning, setIsRunning] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        const status: boolean = await invoke("check_everything_running");
        if (isMounted) setIsRunning(status);
      } catch (e) {
        console.error("Failed to check Everything status:", e);
        if (isMounted) setIsRunning(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handlePickCli = useCallback(async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Executable", extensions: ["exe"] }],
        title: t("settings.everything_cli_dialog_title"),
      });
      if (selected && typeof selected === "string") {
        onUpdateCliPath(selected);
      }
    } catch (e) {
      console.error(e);
    }
  }, [onUpdateCliPath, t]);

  return (
    <SettingSection
      title={t("settings.everything_title")}
      description={t("settings.everything_desc")}
    >
      <SettingRow label={t("settings.everything_status")}>
        <div className={`status-indicator ${isRunning ? "running" : "stopped"}`}>
          <span className="status-dot"></span>
          {isRunning
            ? t("settings.everything_status_running")
            : t("settings.everything_status_stopped")}
        </div>
      </SettingRow>

      <SettingToggle
        label={t("settings.everything_enable")}
        checked={everythingEnabled}
        onChange={onUpdateEnabled}
      />

      <SettingNumberInput
        label={t("settings.everything_limit")}
        value={everythingMaxResults}
        min={1}
        max={1000}
        onChange={onUpdateMaxResults}
      />

      <SettingPathInput
        label={t("settings.everything_cli_label")}
        description={t("settings.everything_cli_hint")}
        value={everythingCliPath}
        placeholder={t("settings.everything_cli_placeholder")}
        browseLabel={t("settings.storage_change")}
        resetLabel={t("common.reset")}
        onBrowse={handlePickCli}
        onReset={() => onUpdateCliPath("")}
      />
    </SettingSection>
  );
}
