import { useTranslation } from "react-i18next";
import { formatBytes } from "../../utils/formatUtils";
import { useThumbnailCache } from "../../hooks/useThumbnailCache";
import { SettingSection, SettingRow, SettingPathInput } from "./primitives";

interface StorageSettingsProps {
  dataStoragePath: string;
  onChangeStoragePath: () => void;
}

export function StorageSettings({
  dataStoragePath,
  onChangeStoragePath,
}: StorageSettingsProps) {
  const { t } = useTranslation();
  const { cacheSize, isClearing, clearCache } = useThumbnailCache();

  return (
    <SettingSection title={t("settings.storage_title")}>
      <SettingPathInput
        label={t("settings.storage_label")}
        description={t("settings.storage_hint")}
        value={dataStoragePath}
        browseLabel={t("settings.storage_change")}
        onBrowse={onChangeStoragePath}
      />

      <SettingRow
        label={t("settings.cache_title")}
        description={
          <>
            <span>{t("settings.cache_size_label")}: </span>
            <strong style={{ marginLeft: "4px", color: "var(--text-main)" }}>
              {cacheSize === null ? t("settings.cache_size_loading") : formatBytes(cacheSize)}
            </strong>
          </>
        }
      >
        <button
          type="button"
          className="settings-button"
          onClick={clearCache}
          disabled={isClearing}
        >
          {t("settings.cache_clear_button")}
        </button>
      </SettingRow>
    </SettingSection>
  );
}
