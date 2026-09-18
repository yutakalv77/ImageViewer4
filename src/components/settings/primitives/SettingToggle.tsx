import { useId, type KeyboardEvent } from "react";
import { SettingRow } from "./SettingRow";
import "./SettingPrimitives.css";

export interface SettingToggleProps {
  label: string;
  description?: string;
  descriptionId?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

/**
 * 直感的なON/OFF切り替えを行うトグルスイッチコンポーネント
 */
export function SettingToggle({
  label,
  description,
  descriptionId,
  checked,
  onChange,
  disabled = false,
  id,
}: SettingToggleProps) {
  const autoId = useId();
  const toggleId = id || `setting-toggle-${autoId}`;
  const descId = descriptionId || (description ? `${toggleId}-desc` : undefined);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <SettingRow
      label={label}
      description={description}
      htmlFor={toggleId}
      descriptionId={descId}
      layout="horizontal"
    >
      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={descId}
        disabled={disabled}
        className={`setting-toggle-switch ${checked ? "is-checked" : ""}`}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={handleKeyDown}
      >
        <span className="setting-toggle-thumb" />
      </button>
    </SettingRow>
  );
}
