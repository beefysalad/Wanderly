import { describe, expect, it } from "vitest";
import { upsertConfigSchema } from "./schemas";

describe("upsertConfigSchema", () => {
  it("accepts any non-null JSON value under a non-empty key", () => {
    for (const value of ["x", 1, true, [1], { a: { b: 2 } }]) {
      expect(upsertConfigSchema.safeParse({ key: "k", value }).success).toBe(true);
    }
  });

  it("rejects a missing/empty key and a missing or null value", () => {
    expect(upsertConfigSchema.safeParse({ value: 1 }).success).toBe(false);
    expect(upsertConfigSchema.safeParse({ key: "", value: 1 }).success).toBe(false);
    expect(upsertConfigSchema.safeParse({ key: "k" }).success).toBe(false);
    expect(upsertConfigSchema.safeParse({ key: "k", value: null }).success).toBe(false);
  });
});
