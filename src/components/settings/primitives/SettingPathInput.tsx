import { useId } from "react";
import { SettingRow } from "./SettingRow";
import { SettingButton } from "./SettingButton";
import "./SettingPrimitives.css";

export interface SettingPathInputProps {
  label: string;
  description?: string;
  value?: string;
  placeholder?: string;
  onBrowse: () => void;
  onReset?: () => void;
  browseLabel?: string;
  resetLabel?: string;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
}

/**
 * パス表示・ファイル/フォルダ参照・リセットを行う一体型コンポーネント
 */
export function SettingPathInput({
  label,
  description,
  value = "",
  placeholder,
  onBrowse,
  onReset,
  browseLabel = "参照...",
  resetLabel = "リセット",
  disabled = false,
  readOnly = true,
  id,
}: SettingPathInputProps) {
  const autoId = useId();
  const inputId = id || `setting-path-${autoId}`;
  const descId = description ? `${inputId}-desc` : undefined;

  return (
    <SettingRow
      label={label}
      description={description}
      htmlFor={inputId}
      descriptionId={descId}
      layout="vertical"
    >
      <div className="path-input-group">
        <input
          id={inputId}
          type="text"
          className="settings-input"
          value={value}
          placeholder={placeholder}
          readOnly={readOnly}
          disabled={disabled}
          aria-describedby={descId}
        />
        <SettingButton
          onClick={onBrowse}
          disabled={disabled}
        >
          {browseLabel}
        </SettingButton>
        {onReset && (
          <SettingButton
            onClick={onReset}
            disabled={disabled || !value}
          >
            {resetLabel}
          </SettingButton>
        )}
      </div>
    </SettingRow>
  );
}
