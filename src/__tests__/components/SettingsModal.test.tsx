import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsModal } from "../../components/SettingsModal";

const mockSetIsSettingsOpen = vi.fn();
const mockSetActiveSettingsTab = vi.fn();

let mockUIState = {
  isSettingsOpen: true,
  setIsSettingsOpen: mockSetIsSettingsOpen,
  activeSettingsTab: "general",
  setActiveSettingsTab: mockSetActiveSettingsTab,
};

vi.mock("../../context/UIContext", () => ({
  useUIContext: () => mockUIState,
}));

vi.mock("../../components/settings/settingsRegistry", () => ({
  SETTINGS_TABS: [
    {
      id: "general",
      labelKey: "settings.tab_general",
      Component: () => <div data-testid="general-tab-content">一般設定コンテンツ</div>,
    },
    {
      id: "storage",
      labelKey: "settings.tab_storage",
      Component: () => <div data-testid="storage-tab-content">ストレージ設定コンテンツ</div>,
    },
  ],
  getSettingsTabById: (id: string) => {
    const tabs: Record<string, any> = {
      general: {
        id: "general",
        labelKey: "settings.tab_general",
        Component: () => <div data-testid="general-tab-content">一般設定コンテンツ</div>,
      },
      storage: {
        id: "storage",
        labelKey: "settings.tab_storage",
        Component: () => <div data-testid="storage-tab-content">ストレージ設定コンテンツ</div>,
      },
    };
    return tabs[id];
  },
  getDefaultSettingsTab: () => ({
    id: "general",
    labelKey: "settings.tab_general",
    Component: () => <div data-testid="general-tab-content">一般設定コンテンツ</div>,
  }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "settings.title": "設定",
        "settings.tab_general": "一般",
        "settings.tab_storage": "保存先",
        "common.close": "閉じる",
      };
      return map[key] || key;
    },
  }),
}));

describe("SettingsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUIState = {
      isSettingsOpen: true,
      setIsSettingsOpen: mockSetIsSettingsOpen,
      activeSettingsTab: "general",
      setActiveSettingsTab: mockSetActiveSettingsTab,
    };
  });

  it("isSettingsOpenがfalseの時は何も描画されないこと", () => {
    mockUIState.isSettingsOpen = false;
    const { container } = render(<SettingsModal />);
    expect(container.firstChild).toBeNull();
  });

  it("モーダル展開時にタイトル、タブメニュー、アクティブなタブコンテンツが描画されること", () => {
    render(<SettingsModal />);

    expect(screen.getByText("設定")).toBeInTheDocument();
    expect(screen.getByText("一般")).toBeInTheDocument();
    expect(screen.getByText("保存先")).toBeInTheDocument();
    expect(screen.getByTestId("general-tab-content")).toBeInTheDocument();
  });

  it("タブをクリックした時にsetActiveSettingsTabが呼ばれること", () => {
    render(<SettingsModal />);

    const storageTab = screen.getByText("保存先");
    fireEvent.click(storageTab);

    expect(mockSetActiveSettingsTab).toHaveBeenCalledWith("storage");
  });

  it("タブをキーボード（Enter/Space）で操作した時にsetActiveSettingsTabが呼ばれること", () => {
    render(<SettingsModal />);

    const storageTab = screen.getByText("保存先");
    fireEvent.keyDown(storageTab, { key: "Enter" });
    expect(mockSetActiveSettingsTab).toHaveBeenCalledWith("storage");

    fireEvent.keyDown(storageTab, { key: " " });
    expect(mockSetActiveSettingsTab).toHaveBeenCalledWith("storage");
  });

  it("閉じるボタンをクリックした時にsetIsSettingsOpen(false)が呼ばれること", () => {
    render(<SettingsModal />);

    const closeBtn = screen.getByRole("button", { name: "Close" });
    fireEvent.click(closeBtn);
    expect(mockSetIsSettingsOpen).toHaveBeenCalledWith(false);

    const footerCloseBtn = screen.getByRole("button", { name: "閉じる" });
    fireEvent.click(footerCloseBtn);
    expect(mockSetIsSettingsOpen).toHaveBeenCalledWith(false);
  });
});
