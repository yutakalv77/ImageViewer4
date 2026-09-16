import { describe, it, expect } from "vitest";
import { formatBytes } from "../utils/formatUtils";

describe("formatUtils", () => {
  it("formats 0 bytes correctly", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(-10)).toBe("0 B");
    expect(formatBytes(NaN)).toBe("0 B");
    expect(formatBytes(Infinity)).toBe("0 B");
  });

  it("formats byte values below 1 KB", () => {
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(1023)).toBe("1023 B");
  });

  it("formats KB values", () => {
    expect(formatBytes(1024)).toBe("1.00 KB");
    expect(formatBytes(1536)).toBe("1.50 KB");
    expect(formatBytes(2048, 0)).toBe("2 KB");
  });

  it("formats MB values", () => {
    expect(formatBytes(1048576)).toBe("1.00 MB");
    expect(formatBytes(1048576 * 12.34)).toBe("12.34 MB");
  });

  it("formats GB values", () => {
    expect(formatBytes(1073741824)).toBe("1.00 GB");
  });
});
