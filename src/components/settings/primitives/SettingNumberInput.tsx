import { useId, type ChangeEvent } from "react";
import { SettingRow } from "./SettingRow";
import "./SettingPrimitives.css";

export interface SettingNumberInputProps {
  label: string;
  description?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
  id?: string;
}

/**
 * 数値設定を行うインプットコンポーネント（単位表示対応）
 */
export function SettingNumberInput({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  disabled = false,
  id,
}: SettingNumberInputProps) {
  const autoId = useId();
  const inputId = id || `setting-number-${autoId}`;
  const descId = description ? `${inputId}-desc` : undefined;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChange(Number.isNaN(val) ? 0 : val);
  };

  return (
    <SettingRow
      label={label}
      description={description}
      htmlFor={inputId}
      descriptionId={descId}
      layout="horizontal"
    >
      <div className="setting-number-container">
        <input
          id={inputId}
          type="number"
          className="settings-input setting-number-input"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={handleChange}
          aria-describedby={descId}
        />
        {unit && <span className="setting-number-unit">{unit}</span>}
      </div>
    </SettingRow>
  );
}
