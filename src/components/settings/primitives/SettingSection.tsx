import type { ReactNode } from "react";
import "./SettingPrimitives.css";

export interface SettingSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * 設定項目を論理的なセクション（見出し・説明文・子要素）としてグループ化するコンポーネント
 */
export function SettingSection({
  title,
  description,
  children,
  className = "",
}: SettingSectionProps) {
  return (
    <section className={`setting-section ${className}`.trim()}>
      {title && <h3 className="setting-section-title">{title}</h3>}
      {description && <p className="setting-section-description">{description}</p>}
      <div className="setting-section-content">{children}</div>
    </section>
  );
}
