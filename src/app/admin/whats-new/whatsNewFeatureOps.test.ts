import { describe, expect, it } from "vitest";
import type { WhatsNewFeature } from "@/src/app/config/whats-new";
import { addFeature, removeFeature, setFeatureColors, updateFeature } from "./whatsNewFeatureOps";

const feature = (overrides: Partial<WhatsNewFeature> = {}): WhatsNewFeature => ({
  icon: "Sparkles",
  title: "Title",
  description: "Description",
  color: "text-amber-400",
  bg: "bg-amber-500/10",
  ...overrides,
});

describe("addFeature", () => {
  it("appends a blank starter feature without mutating the original array", () => {
    const original = [feature()];
    const result = addFeature(original);
    expect(result).toHaveLength(2);
    expect(original).toHaveLength(1);
    expect(result[1]).toMatchObject({ icon: "Sparkles", title: "New Feature" });
  });
});

describe("removeFeature", () => {
  it("removes only the feature at the given index", () => {
    const features = [feature({ title: "A" }), feature({ title: "B" }), feature({ title: "C" })];
    expect(removeFeature(features, 1).map((f) => f.title)).toEqual(["A", "C"]);
  });
});

describe("updateFeature", () => {
  it("updates a single field on a single feature, leaving the others untouched", () => {
    const features = [feature({ title: "A" }), feature({ title: "B" })];
    const result = updateFeature(features, 1, "title", "Updated");
    expect(result[0].title).toBe("A");
    expect(result[1].title).toBe("Updated");
  });
});

describe("setFeatureColors", () => {
  it("applies a color preset's color+bg to one feature without touching its other fields", () => {
    const features = [feature({ title: "A", color: "text-amber-400", bg: "bg-amber-500/10" })];
    const result = setFeatureColors(features, 0, { name: "Blue", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" });
    expect(result[0]).toMatchObject({ title: "A", color: "text-blue-400", bg: "bg-blue-500/10" });
  });
});
