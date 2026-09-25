import { describe, expect, it } from "vitest";
import { createBudgetSchema, updateBudgetSchema } from "./schemas";

describe("createBudgetSchema", () => {
  it("accepts the exact payload the budget form sends (empty-string activityId and category)", () => {
    const result = createBudgetSchema.safeParse({
      amount: 120.5,
      description: "Flights",
      category: "",
      activityId: "",
      isBooked: false,
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(120.5);
  });

  it("coerces a numeric string amount", () => {
    const result = createBudgetSchema.safeParse({ amount: "12.5" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(12.5);
  });

  it("rejects a missing amount", () => {
    expect(createBudgetSchema.safeParse({ description: "x" }).success).toBe(false);
  });

  it("rejects zero, negative, null, and non-numeric amounts", () => {
    for (const amount of [0, -5, null, "abc"]) {
      expect(createBudgetSchema.safeParse({ amount }).success).toBe(false);
    }
  });
});

describe("updateBudgetSchema", () => {
  it("accepts a partial update", () => {
    const result = updateBudgetSchema.safeParse({ isBooked: true });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isBooked).toBe(true);
  });

  it("accepts null and empty-string activityId so a budget can be unlinked", () => {
    expect(updateBudgetSchema.safeParse({ activityId: null }).success).toBe(true);
    expect(updateBudgetSchema.safeParse({ activityId: "" }).success).toBe(true);
  });

  it("rejects a non-positive amount when one is provided", () => {
    expect(updateBudgetSchema.safeParse({ amount: 0 }).success).toBe(false);
  });
});
