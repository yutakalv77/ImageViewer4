import { useTranslation } from "react-i18next";
import { StartupFolderType, ThemeMode, BackgroundSettings, PageNumberPosition } from "../../types";
import { PAGE_NUMBER_POSITION_OPTIONS } from "../../utils/viewerUtils";
import {
  SettingSection,
  SettingSelect,
  SettingToggle,
  SettingPathInput,
  SettingSlider,
} from "./primitives";

interface GeneralSettingsProps {
  startupFolderType: StartupFolderType;
  language: string;
  theme: ThemeMode;
  background: BackgroundSettings;
  pageNumberPosition: PageNumberPosition;
  highPerformanceMode: boolean;
  confirmDelete: boolean;
  onUpdateStartupFolderType: (type: StartupFolderType) => void;
  onUpdateLanguage: (lang: string) => void;
  onUpdateTheme: (theme: ThemeMode) => void;
  onUpdateBackground: (updates: Partial<BackgroundSettings>) => void;
  onPickBackgroundImage: () => void;
  onUpdatePageNumberPosition: (pos: PageNumberPosition) => void;
  onUpdateHighPerformanceMode: (enabled: boolean) => void;
  onUpdateConfirmDelete: (enabled: boolean) => void;
}

const LANGUAGE_OPTIONS = [
  { value: "ja", label: "日本語 (Japanese)" },
  { value: "en", label: "English" },
];

export function GeneralSettings({
  startupFolderType,
  language,
  theme,
  background,
  pageNumberPosition,
  highPerformanceMode,
  confirmDelete,
  onUpdateStartupFolderType,
  onUpdateLanguage,
  onUpdateTheme,
  onUpdateBackground,
  onPickBackgroundImage,
  onUpdatePageNumberPosition,
  onUpdateHighPerformanceMode,
  onUpdateConfirmDelete,
}: GeneralSettingsProps) {
  const { t } = useTranslation();

  const pagePositionOptions = PAGE_NUMBER_POSITION_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(opt.labelKey),
  }));

  return (
    <>
      <SettingSection title={t("settings.general_title")}>
        <SettingSelect<StartupFolderType>
          label={t("settings.startup_folder_label")}
          value={startupFolderType}
          options={[
            { value: "none", label: t("settings.startup_none") },
            { value: "last", label: t("settings.startup_last") },
          ]}
          onChange={onUpdateStartupFolderType}
        />

        <SettingSelect<ThemeMode>
          label={t("settings.theme_label")}
          value={theme}
          options={[
            { value: "dark", label: t("settings.theme_dark") },
            { value: "light", label: t("settings.theme_light") },
            { value: "system", label: t("settings.theme_system") },
          ]}
          onChange={onUpdateTheme}
        />

        <SettingSelect<string>
          label={t("settings.language_label")}
          value={language}
          options={LANGUAGE_OPTIONS}
          onChange={onUpdateLanguage}
        />

        <SettingSelect<PageNumberPosition>
          label={t("settings.page_number_position_label")}
          value={pageNumberPosition}
          options={pagePositionOptions}
          onChange={onUpdatePageNumberPosition}
        />

        <SettingToggle
          id="high-perf-mode-input"
          descriptionId="high-perf-mode-desc"
          label={t("settings.high_perf_label")}
          description={t("settings.high_perf_desc")}
          checked={highPerformanceMode}
          onChange={onUpdateHighPerformanceMode}
        />

        <SettingToggle
          id="confirm-delete-input"
          descriptionId="confirm-delete-desc"
          label={t("settings.confirm_delete_label")}
          description={t("settings.confirm_delete_desc")}
          checked={confirmDelete}
          onChange={onUpdateConfirmDelete}
        />
      </SettingSection>

      <SettingSection title={t("settings.bg_title")}>
        <SettingPathInput
          label={t("settings.bg_label")}
          value={background.path || ""}
          placeholder={t("settings.bg_label")}
          browseLabel={t("settings.storage_change")}
          resetLabel={t("common.reset")}
          onBrowse={onPickBackgroundImage}
          onReset={() => onUpdateBackground({ path: null })}
        />

        {background.path && (
          <>
            <SettingSlider
              label={t("settings.bg_opacity")}
              value={background.opacity}
              min={0}
              max={1}
              step={0.05}
              formatValue={(v) => `${Math.round(v * 100)}%`}
              onChange={(opacity) => onUpdateBackground({ opacity })}
            />

            <SettingSlider
              label={t("settings.bg_blur")}
              value={background.blur}
              min={0}
              max={20}
              step={1}
              formatValue={(v) => `${v}px`}
              onChange={(blur) => onUpdateBackground({ blur })}
            />

            <SettingSelect<"cover" | "contain" | "tile">
              label={t("settings.bg_style")}
              value={background.style}
              options={[
                { value: "cover", label: t("settings.bg_style_cover") },
                { value: "contain", label: t("settings.bg_style_contain") },
                { value: "tile", label: t("settings.bg_style_tile") },
              ]}
              onChange={(style) => onUpdateBackground({ style })}
            />
          </>
        )}
      </SettingSection>
    </>
  );
}
