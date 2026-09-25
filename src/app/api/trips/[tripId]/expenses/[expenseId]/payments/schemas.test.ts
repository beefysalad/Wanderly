import { describe, expect, it } from "vitest";
import { markPaidSchema } from "./schemas";

describe("markPaidSchema", () => {
  it("accepts a boolean isPaid with an optional createPaymentLog", () => {
    expect(markPaidSchema.safeParse({ memberEmail: "a@x.com", isPaid: false }).success).toBe(true);
    expect(
      markPaidSchema.safeParse({ memberEmail: "a@x.com", isPaid: true, createPaymentLog: false }).success,
    ).toBe(true);
  });

  it("rejects a missing email and a non-boolean isPaid", () => {
    expect(markPaidSchema.safeParse({ isPaid: true }).success).toBe(false);
    expect(markPaidSchema.safeParse({ memberEmail: "a@x.com", isPaid: "true" }).success).toBe(false);
    expect(markPaidSchema.safeParse({ memberEmail: "a@x.com" }).success).toBe(false);
  });
});
