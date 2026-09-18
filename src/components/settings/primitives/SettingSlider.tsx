import { useId } from "react";
import { SettingRow } from "./SettingRow";
import "./SettingPrimitives.css";

export interface SettingSliderProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  formatValue?: (val: number) => string;
  onChange: (value: number) => void;
  disabled?: boolean;
  id?: string;
}

/**
 * 範囲調整を行うスライダーコンポーネント（現在値表示付き）
 */
export function SettingSlider({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  formatValue = (val) => String(val),
  onChange,
  disabled = false,
  id,
}: SettingSliderProps) {
  const autoId = useId();
  const sliderId = id || `setting-slider-${autoId}`;
  const descId = description ? `${sliderId}-desc` : undefined;
  const formatted = formatValue(value);

  return (
    <SettingRow
      label={label}
      description={description}
      htmlFor={sliderId}
      descriptionId={descId}
      layout="vertical"
    >
      <div className="setting-slider-container">
        <input
          id={sliderId}
          type="range"
          className="setting-slider"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          aria-describedby={descId}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={formatted}
        />
        <span className="setting-slider-value">{formatted}</span>
      </div>
    </SettingRow>
  );
}
