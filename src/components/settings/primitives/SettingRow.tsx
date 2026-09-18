import type { ReactNode } from "react";
import "./SettingPrimitives.css";

export interface SettingRowProps {
  label: ReactNode;
  description?: ReactNode;
  htmlFor?: string;
  descriptionId?: string;
  children: ReactNode;
  layout?: "horizontal" | "vertical";
  className?: string;
}

/**
 * 1つの設定項目の基本レイアウト（ラベル・説明文・コントロール）を提供するコンポーネント
 */
export function SettingRow({
  label,
  description,
  htmlFor,
  descriptionId,
  children,
  layout = "horizontal",
  className = "",
}: SettingRowProps) {
  return (
    <div className={`setting-row layout-${layout} ${className}`.trim()}>
      <div className="setting-row-header">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="setting-row-label">
            {label}
          </label>
        ) : (
          <span className="setting-row-label">{label}</span>
        )}
        {description && (
          <p id={descriptionId} className="setting-row-description">
            {description}
          </p>
        )}
      </div>
      <div className="setting-row-control">{children}</div>
    </div>
  );
}
