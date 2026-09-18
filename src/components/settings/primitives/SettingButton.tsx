import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./SettingPrimitives.css";

export interface SettingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "default" | "primary" | "danger";
  className?: string;
}

/**
 * 設定画面内で使用する統一ボタンプリミティブコンポーネント
 */
export function SettingButton({
  children,
  variant = "default",
  type = "button",
  className = "",
  disabled = false,
  ...props
}: SettingButtonProps) {
  const variantClass = variant === "default" ? "" : variant;
  const combinedClass = `settings-button ${variantClass} ${className}`.trim();

  return (
    <button
      type={type}
      className={combinedClass}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
