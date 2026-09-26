import { describe, expect, it } from "vitest";
import type { Expense } from "@/src/shared/types";
import { memberStatus, paidBack, shareBox, shareOf, splitMembers } from "./expenseDetailView";

const me = "me@x.com";
const members = [me, "mj@x.com", "rc@x.com"];
const exp = (over: Partial<Expense> = {}): Expense => ({
  id: "e", groupId: "g", tripId: "t", paidBy: "mj@x.com", amount: 900, description: "d", date: "",
  splitWith: members, paidMembers: [], pendingPayments: [], paymentMethod: "gcash", ...over,
});

describe("splitMembers and shareOf", () => {
  it("uses the split, falling back to every member, and always includes the payer", () => {
    expect(splitMembers(exp(), members)).toEqual(members);
    expect(splitMembers(exp({ splitWith: undefined }), members)).toEqual(members);
    expect(splitMembers(exp({ splitWith: [me], paidBy: "mj@x.com" }), members)).toEqual(["mj@x.com", me]);
    expect(shareOf(exp(), members)).toBe(300);
  });
});

describe("memberStatus", () => {
  it("reads paid, confirmed, pending, rejected or unpaid", () => {
    const e = exp({ paidMembers: ["rc@x.com"], pendingPayments: [me] });
    expect(memberStatus(e, "mj@x.com")).toBe("paid");
    expect(memberStatus(e, "rc@x.com")).toBe("confirmed");
    expect(memberStatus(e, me)).toBe("pending");
    expect(memberStatus(exp({ paymentStatusMap: { [me]: "rejected" } }), me)).toBe("rejected");
    expect(memberStatus(exp(), me)).toBe("unpaid");
  });
});

describe("paidBack", () => {
  it("counts confirmed payments among the people who owe the payer", () => {
    expect(paidBack(exp({ paidMembers: ["rc@x.com"] }), members)).toEqual({ done: 1, total: 2, percent: 50 });
    expect(paidBack(exp({ splitWith: ["mj@x.com"] }), members)).toEqual({ done: 0, total: 0, percent: 100 });
  });
});

describe("shareBox", () => {
  it("tells the payer what is still to collect", () => {
    expect(shareBox(exp({ paidBy: me }), members, me, "you")).toMatchObject({ title: "You paid", amount: "₱900", canMark: false });
    expect(shareBox(exp({ paidBy: me, paidMembers: ["mj@x.com", "rc@x.com"] }), members, me, "you").note).toBe("Everyone has paid you back.");
  });

  it("offers 'I've paid' only while your share is unpaid", () => {
    expect(shareBox(exp(), members, me, "MJ")).toMatchObject({ amount: "₱300", canMark: true });
    expect(shareBox(exp(), members, me, "MJ").note).toBe("Send it to MJ via GCash, then let them know here.");
    expect(shareBox(exp({ pendingPayments: [me] }), members, me, "MJ")).toMatchObject({ canMark: false });
    expect(shareBox(exp({ paidMembers: [me] }), members, me, "MJ").note).toBe("Settled. MJ confirmed your payment.");
  });

  it("says so when you aren't in the split", () => {
    expect(shareBox(exp({ splitWith: ["mj@x.com", "rc@x.com"] }), members, me, "MJ")).toMatchObject({ title: "Not in this split", canMark: false });
  });
});
