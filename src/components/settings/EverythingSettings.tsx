import { useTranslation } from "react-i18next";
import {
  SettingSection,
  SettingRow,
  SettingToggle,
  SettingNumberInput,
  SettingPathInput,
} from "./primitives";

export interface EverythingSettingsProps {
  everythingEnabled: boolean;
  everythingMaxResults: number;
  everythingCliPath: string;
  isRunning: boolean | null;
  onUpdateEnabled: (enabled: boolean) => void;
  onUpdateMaxResults: (count: number) => void;
  onUpdateCliPath: (path: string) => void;
  onPickCliPath: () => void;
}

/**
 * Everything 検索設定のプレゼンテーションコンポーネント
 */
export function EverythingSettings({
  everythingEnabled,
  everythingMaxResults,
  everythingCliPath,
  isRunning,
  onUpdateEnabled,
  onUpdateMaxResults,
  onUpdateCliPath,
  onPickCliPath,
}: EverythingSettingsProps) {
  const { t } = useTranslation();

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
        onBrowse={onPickCliPath}
        onReset={() => onUpdateCliPath("")}
      />
    </SettingSection>
  );
}
