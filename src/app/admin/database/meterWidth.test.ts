import { describe, expect, it } from "vitest";
import { meterWidth } from "./meterWidth";

describe("meterWidth", () => {
  it("passes normal percentages through unchanged", () => {
    expect(meterWidth(0)).toBe(0);
    expect(meterWidth(42.5)).toBe(42.5);
    expect(meterWidth(100)).toBe(100);
  });

  it("clamps above 100 down to 100, so an over-quota bar never overflows its track", () => {
    expect(meterWidth(150)).toBe(100);
  });

  it("clamps below 0 up to 0", () => {
    expect(meterWidth(-10)).toBe(0);
  });
});
