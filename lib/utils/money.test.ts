import { describe, expect, it } from "vitest";
import { formatPeso } from "./money";

describe("formatPeso", () => {
  it("rounds to whole pesos and groups thousands", () => {
    expect(formatPeso(20900)).toBe("₱20,900");
    expect(formatPeso(1780.4)).toBe("₱1,780");
    expect(formatPeso(0)).toBe("₱0");
  });
});
