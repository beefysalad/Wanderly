import { formatPeso } from "@/lib/utils/money";
import type { Expense, Group } from "@/src/shared/types";
import { isExpenseSettled } from "./expenseStats";

export type CategoryKey = "accommodation" | "activities" | "food" | "transport" | "other";

// Class strings are literal so Tailwind can generate them.
export const CATEGORY_STYLE: Record<CategoryKey, { label: string; bar: string; text: string }> = {
  accommodation: { label: "Accommodation", bar: "bg-[#38bdf8]", text: "text-[#38bdf8]" },
  activities: { label: "Activities", bar: "bg-[#fbbf24]", text: "text-[#fbbf24]" },
  food: { label: "Food", bar: "bg-[#fb923c]", text: "text-[#fb923c]" },
  transport: { label: "Transport", bar: "bg-[#a78bfa]", text: "text-[#a78bfa]" },
  other: { label: "Other", bar: "bg-[#94a3b8]", text: "text-[#94a3b8]" },
};

/** Maps the stored category (any case, "transportation" or "transport") onto one of the five. */
export function categoryKey(category?: string): CategoryKey {
  const key = (category ?? "").toLowerCase();
  if (key === "transportation") return "transport";
  return key in CATEGORY_STYLE ? (key as CategoryKey) : "other";
}

export type StatusTone = "owe" | "owed" | "waiting" | "muted";

/** The coloured line on the right of an expense row: what this expense means for you. */
export function expenseStatusLine(expense: Expense, userEmail: string): { text: string; tone: StatusTone } {
  const splitWith = expense.splitWith ?? [];
  const share = splitWith.length ? expense.amount / splitWith.length : expense.amount;
  const paid = expense.paidMembers ?? [];

  if (expense.paidBy === userEmail) {
    const stillOwed = splitWith.filter((member) => member !== userEmail && !paid.includes(member)).length * share;
    return stillOwed > 0
      ? { text: `You're owed ${formatPeso(stillOwed)}`, tone: "owed" }
      : { text: "All paid back", tone: "muted" };
  }
  if (!splitWith.includes(userEmail)) return { text: "Not in split", tone: "muted" };
  if (paid.includes(userEmail)) return { text: "Settled", tone: "muted" };
  if (expense.pendingPayments?.includes(userEmail)) return { text: "Awaiting confirmation", tone: "waiting" };
  return { text: `You owe ${formatPeso(share)}`, tone: "owe" };
}

export const TONE_CLASS: Record<StatusTone, string> = {
  owe: "text-[#fb923c]",
  owed: "text-[#34d399]",
  waiting: "text-[#fbbf24]",
  muted: "text-[#64748b]",
};

export interface CategorySpend {
  key: CategoryKey;
  label: string;
  amount: number;
  /** Share of the whole trip's spending, 0–100. */
  percent: number;
  /** Bar length relative to the biggest category, 0–100. */
  relative: number;
}

/** Total spending per category, biggest first. */
export function spendingByCategory(expenses: Expense[]): CategorySpend[] {
  const totals = new Map<CategoryKey, number>();
  for (const expense of expenses) {
    const key = categoryKey(expense.category);
    totals.set(key, (totals.get(key) ?? 0) + expense.amount);
  }

  const grand = [...totals.values()].reduce((sum, amount) => sum + amount, 0) || 1;
  const max = Math.max(1, ...totals.values());
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, amount]) => ({
      key,
      label: CATEGORY_STYLE[key].label,
      amount,
      percent: Math.round((amount / grand) * 100),
      relative: (amount / max) * 100,
    }));
}

/** The name and photo to show for a payer, who may be a member's email or a free-text name. */
export function payerIdentity(group: Group, paidBy: string, userEmail: string) {
  const isYou = paidBy === userEmail;
  const name =
    group.memberNames?.[paidBy] || group.memberMetadata?.[paidBy]?.name || (paidBy.includes("@") ? paidBy.split("@")[0] : paidBy);
  return { key: paidBy, name, short: isYou ? "You" : name.split(" ")[0], imageUrl: group.memberMetadata?.[paidBy]?.imageUrl, isYou };
}

export { isExpenseSettled };
