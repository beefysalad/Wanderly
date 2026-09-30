import { describe, expect, it } from "vitest";
import { formatBytes } from "./formatBytes";

describe("formatBytes", () => {
  it("formats zero specially", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
  });

  it("picks the largest unit that keeps the number under 1024", () => {
    expect(formatBytes(500)).toBe("500 Bytes");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1024 * 1024 * 2.5)).toBe("2.5 MB");
    expect(formatBytes(1024 * 1024 * 1024 * 3)).toBe("3 GB");
  });

  it("respects a custom decimals count", () => {
    expect(formatBytes(1536, 0)).toBe("2 KB");
    expect(formatBytes(1536, 3)).toBe("1.5 KB");
  });
});
