import { describe, expect, it } from "vitest";
import type { Budget, Expense } from "@/src/shared/types";
import { budgetMeta, budgetMeters } from "./budgetView";

const b = (amount: number, isBooked: boolean, over: Partial<Budget> = {}): Budget => ({
  id: "b", tripId: "t", amount, isBooked, createdAt: "", updatedAt: "", ...over,
});
const e = (amount: number) => ({ amount }) as Expense;

describe("budgetMeters", () => {
  it("totals planned, booked and spent with shares of what was planned", () => {
    const [planned, booked, spent] = budgetMeters([b(1000, true), b(3000, false)], [e(1000)]);
    expect(planned).toMatchObject({ amount: 4000, percent: 100, note: "2 items" });
    expect(booked).toMatchObject({ amount: 1000, percent: 25, note: "25.0% of planned" });
    expect(spent).toMatchObject({ amount: 1000, percent: 25, over: false });
  });

  it("flags overspending and caps the bar at full", () => {
    const [, , spent] = budgetMeters([b(1000, false)], [e(1500)]);
    expect(spent).toMatchObject({ percent: 100, over: true, note: "Over budget" });
  });

  it("is all zero with no budget items", () => {
    const meters = budgetMeters([], [e(500)]);
    expect(meters[0]).toMatchObject({ amount: 0, percent: 0, note: "0 items" });
    expect(meters[2]).toMatchObject({ amount: 500, percent: 0, over: false });
  });
});

describe("budgetMeta", () => {
  it("joins the category and the linked activity", () => {
    expect(budgetMeta(b(1, false, { category: "activities", activity: { id: "a", title: "Naked Island", date: "" } }))).toBe("Activities · Naked Island");
    expect(budgetMeta(b(1, false, { category: "food" }))).toBe("Food");
    expect(budgetMeta(b(1, false))).toBe("");
  });
});
