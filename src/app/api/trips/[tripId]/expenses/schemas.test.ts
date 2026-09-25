import { describe, expect, it } from "vitest";
import { confirmPaymentSchema, createExpenseSchema, updateExpenseSchema } from "./schemas";

const valid = {
  paidBy: "a@x.com",
  amount: 100,
  description: "Dinner",
  date: "2026-10-01",
  splitWith: ["b@x.com"],
};

describe("createExpenseSchema", () => {
  it("accepts the shape the expense form sends, including empty-string payment method", () => {
    const result = createExpenseSchema.safeParse({ ...valid, paymentMethod: "", category: "food" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.date).toBeInstanceOf(Date);
  });

  it("accepts an empty splitWith list but rejects a non-array", () => {
    expect(createExpenseSchema.safeParse({ ...valid, splitWith: [] }).success).toBe(true);
    expect(createExpenseSchema.safeParse({ ...valid, splitWith: "b@x.com" }).success).toBe(false);
    expect(createExpenseSchema.safeParse({ ...valid, splitWith: undefined }).success).toBe(false);
  });

  it("rejects missing required fields and non-positive amounts", () => {
    for (const key of ["paidBy", "amount", "description", "date"]) {
      const body: Record<string, unknown> = { ...valid };
      delete body[key];
      expect(createExpenseSchema.safeParse(body).success).toBe(false);
    }
    for (const amount of [0, -5, null, "abc"]) {
      expect(createExpenseSchema.safeParse({ ...valid, amount }).success).toBe(false);
    }
  });

  it("rejects null/empty dates and unknown payment methods", () => {
    expect(createExpenseSchema.safeParse({ ...valid, date: null }).success).toBe(false);
    expect(createExpenseSchema.safeParse({ ...valid, date: "" }).success).toBe(false);
    expect(createExpenseSchema.safeParse({ ...valid, paymentMethod: "bitcoin" }).success).toBe(false);
  });
});

describe("updateExpenseSchema", () => {
  it("accepts partial updates including null detail fields", () => {
    expect(updateExpenseSchema.safeParse({ description: "New" }).success).toBe(true);
    expect(updateExpenseSchema.safeParse({ activityId: null, qrImage: "" }).success).toBe(true);
    expect(updateExpenseSchema.safeParse({ paymentMethod: "cash" }).success).toBe(true);
  });

  it("rejects an empty description, null date and non-positive amount", () => {
    expect(updateExpenseSchema.safeParse({ description: "" }).success).toBe(false);
    expect(updateExpenseSchema.safeParse({ date: null }).success).toBe(false);
    expect(updateExpenseSchema.safeParse({ amount: 0 }).success).toBe(false);
  });
});

describe("confirmPaymentSchema", () => {
  it("accepts confirmed and rejected only", () => {
    expect(confirmPaymentSchema.safeParse({ memberEmail: "a@x.com", status: "confirmed" }).success).toBe(true);
    expect(confirmPaymentSchema.safeParse({ memberEmail: "a@x.com", status: "pending" }).success).toBe(false);
    expect(confirmPaymentSchema.safeParse({ status: "confirmed" }).success).toBe(false);
  });
});
