import { describe, expect, it } from "vitest";
import { whatsNewConfigSchema } from "./schemas";

const feature = { icon: "i", title: "t", description: "d", color: "c", bg: "b" };

describe("whatsNewConfigSchema", () => {
  it("accepts a version with a list of features (unknown feature fields are dropped)", () => {
    const result = whatsNewConfigSchema.safeParse({
      version: "v3",
      features: [{ ...feature, extra: 1 }],
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.features[0]).toEqual(feature);
  });

  it("rejects a missing version, a non-array features, and malformed features", () => {
    expect(whatsNewConfigSchema.safeParse({ features: [] }).success).toBe(false);
    expect(whatsNewConfigSchema.safeParse({ version: "", features: [] }).success).toBe(false);
    expect(whatsNewConfigSchema.safeParse({ version: "v", features: "x" }).success).toBe(false);
    expect(whatsNewConfigSchema.safeParse({ version: "v", features: [{ title: "t" }] }).success).toBe(false);
  });
});
