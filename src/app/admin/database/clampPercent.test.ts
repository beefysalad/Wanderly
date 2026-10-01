import { describe, expect, it } from "vitest";
import { clampPercent } from "./clampPercent";

describe("clampPercent", () => {
  it("passes normal percentages through unchanged", () => {
    expect(clampPercent(0)).toBe(0);
    expect(clampPercent(42.5)).toBe(42.5);
    expect(clampPercent(100)).toBe(100);
  });

  it("clamps above 100 down to 100, so an over-quota bar never overflows its track", () => {
    expect(clampPercent(150)).toBe(100);
  });

  it("clamps below 0 up to 0", () => {
    expect(clampPercent(-10)).toBe(0);
  });
});
