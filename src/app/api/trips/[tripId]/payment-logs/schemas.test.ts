import { describe, expect, it } from "vitest";
import { createPaymentLogSchema } from "./schemas";

const valid = { expenseId: "e1", payerEmail: "a@x.com", payeeEmail: "b@x.com", amount: 50 };

describe("createPaymentLogSchema", () => {
  it("accepts a valid payload and coerces a numeric string amount", () => {
    const result = createPaymentLogSchema.safeParse({ ...valid, amount: "12.5" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(12.5);
  });

  it("rejects missing required fields", () => {
    for (const key of ["expenseId", "payerEmail", "payeeEmail", "amount"]) {
      const rest: Record<string, unknown> = { ...valid };
      delete rest[key];
      expect(createPaymentLogSchema.safeParse(rest).success).toBe(false);
    }
  });

  it("rejects zero, negative and null amounts", () => {
    for (const amount of [0, -1, null]) {
      expect(createPaymentLogSchema.safeParse({ ...valid, amount }).success).toBe(false);
    }
  });

  it("rejects an unknown payment method", () => {
    expect(createPaymentLogSchema.safeParse({ ...valid, paymentMethod: "bitcoin" }).success).toBe(
      false,
    );
  });
});
