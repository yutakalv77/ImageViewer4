import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Tauri APIs that are not available in jsdom
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
  convertFileSrc: vi.fn((path) => `asset://${path}`),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
  emit: vi.fn(() => Promise.resolve()),
}));

const mockWindowInstance = {
  onDragDropEvent: vi.fn(() => Promise.resolve(() => {})),
  isFullscreen: vi.fn(() => Promise.resolve(false)),
  setFullscreen: vi.fn(() => Promise.resolve()),
  isMaximized: vi.fn(() => Promise.resolve(false)),
  toggleMaximize: vi.fn(() => Promise.resolve()),
  minimize: vi.fn(() => Promise.resolve()),
  maximize: vi.fn(() => Promise.resolve()),
  close: vi.fn(() => Promise.resolve()),
  startDragging: vi.fn(() => Promise.resolve()),
  startResizeDragging: vi.fn(() => Promise.resolve()),
  unmaximize: vi.fn(() => Promise.resolve()),
  onResized: vi.fn(() => Promise.resolve(() => {})),
  outerPosition: vi.fn(() => Promise.resolve({ x: 100, y: 150 })),
  outerSize: vi.fn(() => Promise.resolve({ width: 800, height: 600 })),
  setPosition: vi.fn(() => Promise.resolve()),
  setSize: vi.fn(() => Promise.resolve()),
};

vi.mock("@tauri-apps/api/window", () => {
  const defaultMonitor = {
    name: "Primary",
    size: { width: 1920, height: 1080 },
    position: { x: 0, y: 0 },
    workArea: {
      position: { x: 0, y: 0 },
      size: { width: 1920, height: 1040 },
    },
    scaleFactor: 1,
  };
  return {
    getCurrentWindow: vi.fn(() => mockWindowInstance),
    currentMonitor: vi.fn(() => Promise.resolve(defaultMonitor)),
    primaryMonitor: vi.fn(() => Promise.resolve(defaultMonitor)),
  };
});

vi.mock("@tauri-apps/api/dpi", () => {
  class PhysicalPosition {
    type = "Physical";
    x: number;
    y: number;
    constructor(x: number, y: number) {
      this.x = x;
      this.y = y;
    }
  }
  class PhysicalSize {
    type = "Physical";
    width: number;
    height: number;
    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
    }
  }
  return { PhysicalPosition, PhysicalSize };
});

vi.mock("@tauri-apps/plugin-os", () => ({
  type: vi.fn(() => "windows"),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
  message: vi.fn(),
  confirm: vi.fn(() => Promise.resolve(true)),
  ask: vi.fn(() => Promise.resolve(true)),
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

if (typeof window !== "undefined") {
  class MockIntersectionObserver {
    callback: IntersectionObserverCallback;
    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }
    observe = vi.fn((target: Element) => {
      // Trigger intersection immediately in tests
      this.callback(
        [{ isIntersecting: true, target } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver
      );
    });
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
    root = null;
    rootMargin = "";
    thresholds = [];
  }
  window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
}
