import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Tauri APIs that are not available in jsdom
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
  convertFileSrc: vi.fn((path) => `asset://${path}`),
}));

const mockWindowInstance = {
  onDragDropEvent: vi.fn(() => Promise.resolve(() => {})),
  isFullscreen: vi.fn(() => Promise.resolve(false)),
  setFullscreen: vi.fn(() => Promise.resolve()),
  isMaximized: vi.fn(() => Promise.resolve(false)),
  toggleMaximize: vi.fn(() => Promise.resolve()),
  minimize: vi.fn(() => Promise.resolve()),
  close: vi.fn(() => Promise.resolve()),
  startDragging: vi.fn(() => Promise.resolve()),
  unmaximize: vi.fn(() => Promise.resolve()),
  onResized: vi.fn(() => Promise.resolve(() => {})),
};

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: vi.fn(() => mockWindowInstance),
}));

vi.mock("@tauri-apps/plugin-os", () => ({
  type: vi.fn(() => "windows"),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
  message: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  exists: vi.fn(),
  mkdir: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-clipboard-manager", () => ({
  writeText: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-opener", () => ({
  revealItemInDir: vi.fn(),
  openPath: vi.fn(),
}));

vi.mock("@tauri-apps/api/path", () => ({
  appDataDir: vi.fn(() => Promise.resolve("/mock/appDataDir")),
  join: vi.fn((...args: string[]) => Promise.resolve(args.join("/"))),
}));
