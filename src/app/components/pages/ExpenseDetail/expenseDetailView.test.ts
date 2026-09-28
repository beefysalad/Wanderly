import { describe, expect, it } from "vitest";
import type { Expense } from "@/src/shared/types";
import { expenseStatusLine } from "../Expenses/expenseView";
import { memberStatus, paidBack, shareBox, splitMembers } from "./expenseDetailView";

const me = "me@x.com";
// ₱100 split three ways, paid by MJ, as the API returns it: the leftover centavo sits on the payer.
const exp = (over: Partial<Expense> = {}): Expense => ({
  id: "e", groupId: "g", tripId: "t", paidBy: "mj@x.com", amount: 100, description: "d", date: "",
  splits: [
    { member: me, shareAmount: 33.33 },
    { member: "mj@x.com", shareAmount: 33.34 },
    { member: "rc@x.com", shareAmount: 33.33 },
  ],
  paidMembers: [], pendingPayments: [], paymentMethod: "gcash", ...over,
});
// The same ₱100, paid by me.
const paidByMe = (over: Partial<Expense> = {}) =>
  exp({
    paidBy: me,
    splits: [
      { member: me, shareAmount: 33.34 },
      { member: "mj@x.com", shareAmount: 33.33 },
      { member: "rc@x.com", shareAmount: 33.33 },
    ],
    ...over,
  });
const onlyRc = [{ member: "rc@x.com", shareAmount: 100 }];

describe("splitMembers", () => {
  it("lists the split, always including the payer; an empty split is only the payer", () => {
    expect(splitMembers(exp())).toEqual([me, "mj@x.com", "rc@x.com"]);
    expect(splitMembers(exp({ splits: onlyRc }))).toEqual(["mj@x.com", "rc@x.com"]);
    expect(splitMembers(exp({ splits: [] }))).toEqual(["mj@x.com"]);
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
    expect(paidBack(exp({ paidMembers: ["rc@x.com"] }))).toEqual({ done: 1, total: 2, percent: 50 });
    expect(paidBack(exp({ splits: [{ member: "mj@x.com", shareAmount: 100 }] }))).toEqual({ done: 0, total: 0, percent: 100 });
    expect(paidBack(exp({ splits: [] }))).toEqual({ done: 0, total: 0, percent: 100 });
  });
});

describe("shareBox", () => {
  it("tells the payer what is still to collect, to the centavo", () => {
    expect(shareBox(paidByMe(), me, "you")).toMatchObject({ title: "You paid", amount: "₱100", canMark: false });
    expect(shareBox(paidByMe(), me, "you").note).toBe("₱66.66 still to collect from 2 people.");
    expect(shareBox(paidByMe({ paidMembers: ["mj@x.com"] }), me, "you").note).toBe("₱33.33 still to collect from 1 person.");
    expect(shareBox(paidByMe({ paidMembers: ["mj@x.com", "rc@x.com"] }), me, "you").note).toBe("Everyone has paid you back.");
  });

  it("offers 'I've paid' only while your share is unpaid", () => {
    expect(shareBox(exp(), me, "MJ")).toMatchObject({ amount: "₱33.33", canMark: true });
    expect(shareBox(exp(), me, "MJ").note).toBe("Send it to MJ via GCash, then let them know here.");
    expect(shareBox(exp({ pendingPayments: [me] }), me, "MJ")).toMatchObject({ canMark: false });
    expect(shareBox(exp({ paidMembers: [me] }), me, "MJ").note).toBe("Settled. MJ confirmed your payment.");
  });

  it("says so when you aren't in the split, including when nobody is", () => {
    expect(shareBox(exp({ splits: onlyRc }), me, "MJ")).toMatchObject({ title: "Not in this split", canMark: false });
    expect(shareBox(exp({ splits: [] }), me, "MJ")).toMatchObject({ title: "Not in this split", canMark: false });
  });

  it("shows the same amounts as the expense list", () => {
    expect(expenseStatusLine(exp(), me).text).toBe(`You owe ${shareBox(exp(), me, "MJ").amount}`);
    expect(expenseStatusLine(paidByMe(), me).text).toBe(`You're owed ${shareBox(paidByMe(), me, "you").note.split(" ")[0]}`);
  });
});
