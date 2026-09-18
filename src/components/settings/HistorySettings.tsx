import { useTranslation } from "react-i18next";
import { SettingSection, SettingNumberInput } from "./primitives";

interface HistorySettingsProps {
  historyRetentionDays: number;
  onUpdateHistoryRetention: (days: number) => void;
}

export function HistorySettings({
  historyRetentionDays,
  onUpdateHistoryRetention,
}: HistorySettingsProps) {
  const { t } = useTranslation();

  return (
    <SettingSection title={t("settings.history_title")}>
      <SettingNumberInput
        label={t("settings.history_label")}
        description={t("settings.history_hint")}
        value={historyRetentionDays}
        min={0}
        max={1000}
        onChange={onUpdateHistoryRetention}
      />
    </SettingSection>
  );
}
