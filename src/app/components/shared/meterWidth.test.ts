import { describe, expect, it } from "vitest";
import { meterWidth } from "./meterWidth";

describe("meterWidth", () => {
  it("rounds to the nearest 5% and clamps", () => {
    expect(meterWidth(0)).toBe("w-0");
    expect(meterWidth(33.3)).toBe("w-[35%]");
    expect(meterWidth(62)).toBe("w-[60%]");
    expect(meterWidth(100)).toBe("w-full");
    expect(meterWidth(250)).toBe("w-full");
    expect(meterWidth(-5)).toBe("w-0");
  });
});
