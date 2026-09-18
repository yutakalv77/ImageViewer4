import { useId, type ChangeEvent } from "react";
import { SettingRow } from "./SettingRow";
import "./SettingPrimitives.css";

export interface SettingSelectOption<T extends string | number> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SettingSelectProps<T extends string | number> {
  label: string;
  description?: string;
  value: T;
  options: SettingSelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  id?: string;
  layout?: "horizontal" | "vertical";
}

/**
 * 統一されたドロップダウン選択コンポーネント
 */
export function SettingSelect<T extends string | number>({
  label,
  description,
  value,
  options,
  onChange,
  disabled = false,
  id,
  layout = "horizontal",
}: SettingSelectProps<T>) {
  const autoId = useId();
  const selectId = id || `setting-select-${autoId}`;
  const descId = description ? `${selectId}-desc` : undefined;

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const rawVal = e.target.value;
    const matched = options.find((opt) => String(opt.value) === rawVal);
    if (matched) {
      onChange(matched.value);
    }
  };

  return (
    <SettingRow
      label={label}
      description={description}
      htmlFor={selectId}
      descriptionId={descId}
      layout={layout}
    >
      <select
        id={selectId}
        className="settings-select"
        value={String(value)}
        onChange={handleChange}
        disabled={disabled}
        aria-describedby={descId}
      >
        {options.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    </SettingRow>
  );
}
