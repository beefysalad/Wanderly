import { describe, expect, it } from "vitest";
import type { Group, PaymentLog } from "@/src/shared/types";
import { getMemberAvatarFromLog, getMemberInitialsFromLog } from "./paymentLogMembers";

const log = (overrides: Partial<PaymentLog>): PaymentLog => ({
  id: "l",
  tripId: "t",
  expenseId: "e",
  expenseDescription: "Dinner",
  payer: "Alice Smith",
  payee: "bob@x.com",
  payerEmail: "alice@x.com",
  payeeEmail: "bob@x.com",
  amount: 10,
  timestamp: "2026-10-01T00:00:00.000Z",
  ...overrides,
});

const group = {
  memberEmails: ["alice@x.com", "bob@x.com"],
  memberNames: { "alice@x.com": "Alice Smith" },
  memberMetadata: {
    "alice@x.com": { imageUrl: "alice.png" },
    "bob@x.com": { imageUrl: "bob.png" },
  },
} as unknown as Group;

describe("getMemberAvatarFromLog", () => {
  it("prefers the image on the log itself", () => {
    expect(getMemberAvatarFromLog(log({ payerImageUrl: "log.png" }), "payer", group)).toBe("log.png");
  });

  it("falls back to member metadata by email", () => {
    expect(getMemberAvatarFromLog(log({}), "payer", group)).toBe("alice.png");
  });

  it("finds the member by display name when the email is missing", () => {
    const l = log({ payerEmail: "", payer: "Alice Smith" });

    expect(getMemberAvatarFromLog(l, "payer", group)).toBe("alice.png");
  });

  it("finds the member by email local part", () => {
    const l = log({ payeeEmail: "", payee: "bob" });

    expect(getMemberAvatarFromLog(l, "payee", group)).toBe("bob.png");
  });

  it("returns undefined for unknown people or a missing group", () => {
    expect(getMemberAvatarFromLog(log({ payer: "Zed", payerEmail: "" }), "payer", group)).toBeUndefined();
    expect(getMemberAvatarFromLog(log({}), "payer", null)).toBeUndefined();
  });
});

describe("getMemberInitialsFromLog", () => {
  it("uses the first two letters of an email", () => {
    expect(getMemberInitialsFromLog(log({}), "payee")).toBe("BO");
  });

  it("uses the first letter of the first two words of a name", () => {
    expect(getMemberInitialsFromLog(log({}), "payer")).toBe("AS");
  });

  it("uses the first two letters of a single-word name", () => {
    expect(getMemberInitialsFromLog(log({ payer: "guest" }), "payer")).toBe("GU");
  });
});
