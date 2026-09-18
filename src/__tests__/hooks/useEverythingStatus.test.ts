import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useEverythingStatus } from "../../hooks/useEverythingStatus";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}));

describe("useEverythingStatus hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("マウント時にcheck_everything_runningを呼び出し、isRunningを更新すること", async () => {
    (invoke as any).mockResolvedValue(true);

    const { result } = renderHook(() => useEverythingStatus({ pollingIntervalMs: 0 }));

    expect(result.current.isRunning).toBeNull();

    await waitFor(() => {
      expect(result.current.isRunning).toBe(true);
    });
    expect(invoke).toHaveBeenCalledWith("check_everything_running");
  });

  it("invokeが失敗した場合はisRunningをfalseにすること", async () => {
    (invoke as any).mockRejectedValue(new Error("RPC failed"));

    const { result } = renderHook(() => useEverythingStatus({ pollingIntervalMs: 0 }));

    await waitFor(() => {
      expect(result.current.isRunning).toBe(false);
    });
  });

  it("checkStatusを手動で呼ぶとステータスが更新されること", async () => {
    (invoke as any).mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    const { result } = renderHook(() => useEverythingStatus({ pollingIntervalMs: 0 }));

    await waitFor(() => {
      expect(result.current.isRunning).toBe(false);
    });

    let status = false;
    await act(async () => {
      status = await result.current.checkStatus();
    });

    expect(status).toBe(true);
    expect(result.current.isRunning).toBe(true);
  });

  it("pickCliPathでファイルが選択された場合パスを返すこと", async () => {
    (open as any).mockResolvedValue("C:/tools/es.exe");

    const { result } = renderHook(() => useEverythingStatus({ initialCheck: false }));

    let selectedPath: string | null = null;
    await act(async () => {
      selectedPath = await result.current.pickCliPath("CLIツールの選択");
    });

    expect(open).toHaveBeenCalledWith({
      multiple: false,
      filters: [{ name: "Executable", extensions: ["exe"] }],
      title: "CLIツールの選択",
    });
    expect(selectedPath).toBe("C:/tools/es.exe");
  });

  it("pickCliPathでキャンセルまたはエラーのときはnullを返すこと", async () => {
    (open as any).mockResolvedValue(null);

    const { result } = renderHook(() => useEverythingStatus({ initialCheck: false }));

    let selectedPath: string | null = "dummy";
    await act(async () => {
      selectedPath = await result.current.pickCliPath();
    });

    expect(selectedPath).toBeNull();
  });
});
