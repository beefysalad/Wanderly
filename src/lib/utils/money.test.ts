import { describe, expect, it } from "vitest";
import { computeShares, formatPeso, formatPesoExact, fromCents, pesoAmountSchema, toCents } from "./money";

describe("formatPeso", () => {
  it("rounds to whole pesos and groups thousands", () => {
    expect(formatPeso(20900)).toBe("₱20,900");
    expect(formatPeso(1780.4)).toBe("₱1,780");
    expect(formatPeso(0)).toBe("₱0");
  });
});

describe("formatPesoExact", () => {
  it("always shows two decimals and groups thousands", () => {
    expect(formatPesoExact(33.34)).toBe("₱33.34");
    expect(formatPesoExact(1780.4)).toBe("₱1,780.40");
    expect(formatPesoExact(20900)).toBe("₱20,900.00");
    expect(formatPesoExact(0)).toBe("₱0.00");
  });
});

describe("toCents / fromCents", () => {
  it("converts pesos to whole centavos without float drift, rounding half up", () => {
    expect(toCents(33.33)).toBe(3333);
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(12.345)).toBe(1235);
    expect(toCents(9_999_999_999.99)).toBe(999_999_999_999);
    expect(fromCents(3334)).toBe(33.34);
  });
});

describe("pesoAmountSchema", () => {
  it("coerces strings and rounds to the centavo money is stored at", () => {
    expect(pesoAmountSchema.parse("33.335")).toBe(33.34);
    expect(pesoAmountSchema.parse(33.3333333)).toBe(33.33);
    expect(pesoAmountSchema.parse(9_999_999_999.99)).toBe(9_999_999_999.99);
  });

  it("rejects amounts that round to nothing, are negative, aren't numbers, or don't fit a money column", () => {
    for (const amount of [0, 0.004, -5, null, "abc", Infinity, 10_000_000_000]) {
      expect(pesoAmountSchema.safeParse(amount).success).toBe(false);
    }
  });
});

describe("computeShares", () => {
  const trio = ["alice", "bob", "cara"];

  it.each([
    { case: "₱100 / 3, no payer in the split", cents: 10000, people: trio, payer: undefined, shares: [3334, 3333, 3333] },
    { case: "₱100 / 3, payer listed first", cents: 10000, people: trio, payer: "alice", shares: [3334, 3333, 3333] },
    { case: "₱100 / 3, payer listed last takes the extra centavo", cents: 10000, people: trio, payer: "cara", shares: [3333, 3333, 3334] },
    { case: "payer outside the split: leftovers go in list order", cents: 10000, people: trio, payer: "dan", shares: [3334, 3333, 3333] },
    { case: "two leftover centavos: payer first, then list order", cents: 10002, people: ["a", "b", "c", "d"], payer: "c", shares: [2501, 2500, 2501, 2500] },
    { case: "divides evenly", cents: 9000, people: trio, payer: "bob", shares: [3000, 3000, 3000] },
    { case: "one person carries it all", cents: 12345, people: ["alice"], payer: "bob", shares: [12345] },
    { case: "fewer centavos than people", cents: 2, people: trio, payer: "bob", shares: [1, 1, 0] },
    { case: "zero amount", cents: 0, people: trio, payer: "alice", shares: [0, 0, 0] },
  ])("$case", ({ cents, people, payer, shares }) => {
    expect(computeShares(cents, people, payer)).toEqual(shares);
  });

  it("always adds back up to the amount, with shares at most one centavo apart", () => {
    for (const cents of [1, 99, 10000, 10001, 123457, 999_999_999_999]) {
      for (let count = 1; count <= 13; count++) {
        const people = Array.from({ length: count }, (_, i) => `m${i}`);
        const shares = computeShares(cents, people, "m3");
        expect(shares).toHaveLength(count);
        expect(shares.reduce((sum, share) => sum + share, 0)).toBe(cents);
        expect(Math.max(...shares) - Math.min(...shares)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("gives nobody a share when nobody is in the split", () => {
    expect(computeShares(10000, [], "alice")).toEqual([]);
  });

  it("gives only the first of two identical names the payer's extra centavo", () => {
    expect(computeShares(10000, ["gary", "bob", "gary"], "gary")).toEqual([3334, 3333, 3333]);
  });

  it("rejects amounts that aren't whole, non-negative centavos", () => {
    expect(() => computeShares(33.5, trio)).toThrow(RangeError);
    expect(() => computeShares(-100, trio)).toThrow(RangeError);
    expect(() => computeShares(Number.NaN, trio)).toThrow(RangeError);
  });
});
