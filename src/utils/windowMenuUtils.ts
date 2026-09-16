export interface ContextMenuItem {
  label?: string;
  onClick?: () => void;
  separator?: boolean;
  disabled?: boolean;
  shortcut?: string;
  icon?: React.ReactNode;
}

export interface WindowMenuActionOptions {
  isMaximized: boolean;
  t: (key: string) => string;
  onRestore: () => void;
  onMove: () => void;
  onSize: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
}

/**
 * Windows標準のシステムメニュー（ウィンドウ操作メニュー）のアイテム定義を構築する純粋関数
 */
export function buildWindowMenuItems(options: WindowMenuActionOptions): ContextMenuItem[] {
  return [
    {
      label: options.t("window_menu.restore"),
      disabled: !options.isMaximized,
      onClick: options.onRestore,
    },
    {
      label: options.t("window_menu.move"),
      disabled: options.isMaximized,
      onClick: options.onMove,
    },
    {
      label: options.t("window_menu.size"),
      disabled: options.isMaximized,
      onClick: options.onSize,
    },
    {
      label: options.t("window_menu.minimize"),
      disabled: false,
      onClick: options.onMinimize,
    },
    {
      label: options.t("window_menu.maximize"),
      disabled: options.isMaximized,
      onClick: options.onMaximize,
    },
    {
      separator: true,
    },
    {
      label: options.t("window_menu.close"),
      disabled: false,
      shortcut: "Alt+F4",
      onClick: options.onClose,
    },
  ];
}

/**
 * イベントのターゲット要素が入力フォーム（テキスト選択・編集用）であるかを判定するヘルパー
 */
export function isTargetInputOrTextarea(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA";
}
