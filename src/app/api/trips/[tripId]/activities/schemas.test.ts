import { describe, expect, it } from "vitest";
import { createActivitySchema, updateActivitySchema } from "./schemas";

describe("createActivitySchema", () => {
  it("accepts a minimal payload and coerces the date", () => {
    const result = createActivitySchema.safeParse({ title: "Museum", date: "2026-10-01" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.date).toBeInstanceOf(Date);
  });

  it("rejects a missing or blank title", () => {
    expect(createActivitySchema.safeParse({ date: "2026-10-01" }).success).toBe(false);
    expect(createActivitySchema.safeParse({ title: "  ", date: "2026-10-01" }).success).toBe(false);
  });

  it("rejects missing, null, empty, and unparseable dates", () => {
    for (const date of [undefined, null, "", "not-a-date"]) {
      expect(createActivitySchema.safeParse({ title: "x", date }).success).toBe(false);
    }
  });
});

describe("updateActivitySchema", () => {
  it("accepts a partial update and null detail fields", () => {
    expect(updateActivitySchema.safeParse({ done: true }).success).toBe(true);
    expect(updateActivitySchema.safeParse({ pickupTime: null, notes: "" }).success).toBe(true);
  });

  it("rejects null/empty dates and an empty title", () => {
    expect(updateActivitySchema.safeParse({ date: null }).success).toBe(false);
    expect(updateActivitySchema.safeParse({ date: "" }).success).toBe(false);
    expect(updateActivitySchema.safeParse({ title: "" }).success).toBe(false);
  });
});
