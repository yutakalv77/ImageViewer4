import { describe, it, expect } from "vitest";
import { formatBytes, formatDate } from "../../utils/formatUtils";

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

  describe("formatDate", () => {
    it("formats timestamp numbers correctly", () => {
      const ts = 1700000000000;
      expect(formatDate(ts)).toBe(new Date(ts).toLocaleString());
    });

    it("formats ISO string correctly", () => {
      const iso = "2024-01-01T12:00:00Z";
      expect(formatDate(iso)).toBe(new Date(iso).toLocaleString());
    });

    it("formats Date object correctly", () => {
      const date = new Date(2024, 0, 1, 12, 0, 0);
      expect(formatDate(date)).toBe(date.toLocaleString());
    });

    it("returns empty string for null, undefined, or empty values", () => {
      expect(formatDate(null)).toBe("");
      expect(formatDate(undefined)).toBe("");
      expect(formatDate("")).toBe("");
      expect(formatDate(0)).toBe("");
    });

    it("returns empty string for invalid date strings", () => {
      expect(formatDate("invalid-date-string")).toBe("");
      expect(formatDate(NaN)).toBe("");
    });
  });
});
