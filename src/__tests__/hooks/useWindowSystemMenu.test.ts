import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWindowSystemMenu } from "../../hooks/useWindowSystemMenu";
import { getCurrentWindow } from "@tauri-apps/api/window";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("useWindowSystemMenu hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初期状態では menuPosition が null であること", async () => {
    let hookResult: any;
    await act(async () => {
      hookResult = renderHook(() => useWindowSystemMenu()).result;
    });
    expect(hookResult.current.menuPosition).toBeNull();
    expect(hookResult.current.menuItems).toHaveLength(7);
  });

  it("ヘッダーを右クリックした時に menuPosition が設定されること", async () => {
    let hookResult: any;
    await act(async () => {
      hookResult = renderHook(() => useWindowSystemMenu()).result;
    });

    const mockEvent = {
      target: document.createElement("div"),
      clientX: 150,
      clientY: 25,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent;

    await act(async () => {
      hookResult.current.handleHeaderContextMenu(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(hookResult.current.menuPosition).toEqual({ x: 150, y: 25 });
  });

  it("input要素上での右クリックではメニューを開かないこと", async () => {
    let hookResult: any;
    await act(async () => {
      hookResult = renderHook(() => useWindowSystemMenu()).result;
    });

    const mockEvent = {
      target: document.createElement("input"),
      clientX: 200,
      clientY: 30,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent;

    await act(async () => {
      hookResult.current.handleHeaderContextMenu(mockEvent);
    });

    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    expect(hookResult.current.menuPosition).toBeNull();
  });

  it("closeMenu を呼び出すと menuPosition が null に戻ること", async () => {
    let hookResult: any;
    await act(async () => {
      hookResult = renderHook(() => useWindowSystemMenu()).result;
    });

    await act(async () => {
      hookResult.current.handleHeaderContextMenu({
        target: document.createElement("div"),
        clientX: 100,
        clientY: 50,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent);
    });

    expect(hookResult.current.menuPosition).not.toBeNull();

    act(() => {
      hookResult.current.closeMenu();
    });

    expect(hookResult.current.menuPosition).toBeNull();
  });

  it("Alt + Space キーでシステムメニューが表示されること", async () => {
    let hookResult: any;
    await act(async () => {
      hookResult = renderHook(() => useWindowSystemMenu()).result;
    });

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          altKey: true,
          code: "Space",
        })
      );
    });

    expect(hookResult.current.menuPosition).toEqual({ x: 8, y: 32 });
  });

  it("メニュー項目のアクション実行時にウィンドウ操作APIが呼ばれること", async () => {
    const mockWindow = getCurrentWindow();
    let hookResult: any;
    await act(async () => {
      hookResult = renderHook(() => useWindowSystemMenu()).result;
    });

    // 最小化
    const minimizeItem = hookResult.current.menuItems.find(
      (item: any) => item.label === "window_menu.minimize"
    );
    await act(async () => {
      minimizeItem?.onClick?.();
    });
    expect(mockWindow.minimize).toHaveBeenCalledTimes(1);

    // 最大化
    const maximizeItem = hookResult.current.menuItems.find(
      (item: any) => item.label === "window_menu.maximize"
    );
    await act(async () => {
      maximizeItem?.onClick?.();
    });
    expect(mockWindow.maximize).toHaveBeenCalledTimes(1);

    // 閉じる
    const closeItem = hookResult.current.menuItems.find(
      (item: any) => item.label === "window_menu.close"
    );
    await act(async () => {
      closeItem?.onClick?.();
    });
    expect(mockWindow.close).toHaveBeenCalledTimes(1);
  });
});
