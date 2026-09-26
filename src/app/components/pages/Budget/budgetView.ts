import { formatPeso } from "@/lib/utils/money";
import type { Budget, Expense } from "@/src/shared/types";

export interface Meter {
  label: string;
  amount: number;
  /** How full the bar is, 0–100. */
  percent: number;
  note: string;
  over: boolean;
}

/** Planned, booked and spent for a trip, with each as a share of what was planned. */
export function budgetMeters(budgets: Budget[], expenses: Expense[]): Meter[] {
  const planned = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
  const booked = budgets.filter((b) => b.isBooked).reduce((sum, b) => sum + Number(b.amount), 0);
  const spent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const share = (amount: number) => (planned > 0 ? (amount / planned) * 100 : 0);
  const overBudget = planned > 0 && spent > planned;

  return [
    {
      label: "Total planned",
      amount: planned,
      percent: planned > 0 ? 100 : 0,
      note: `${budgets.length} ${budgets.length === 1 ? "item" : "items"}`,
      over: false,
    },
    { label: "Total booked", amount: booked, percent: Math.min(share(booked), 100), note: `${share(booked).toFixed(1)}% of planned`, over: false },
    {
      label: "Total spent",
      amount: spent,
      percent: Math.min(share(spent), 100),
      note: overBudget ? "Over budget" : `${share(spent).toFixed(1)}% of planned`,
      over: overBudget,
    },
  ];
}

/** "Activities · Naked Island", or just the category. */
export function budgetMeta(budget: Budget): string {
  const category = budget.category ? budget.category.charAt(0).toUpperCase() + budget.category.slice(1) : "";
  const linked = budget.activity?.title;
  return [category, linked].filter(Boolean).join(" · ");
}

export { formatPeso };
