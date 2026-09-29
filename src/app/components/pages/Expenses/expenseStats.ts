import { fromCents, toCents } from "@/src/lib/utils/money";
import type { Expense } from "@/src/shared/types";

export type ExpensesView = "all" | "unsettled" | "settled" | "logs" | "analysis";

/** An expense is settled once every member in the split has paid (or is the payer). An empty split is settled. */
export function isExpenseSettled(expense: Expense): boolean {
  const paidMembers = expense.paidMembers || [];
  return expense.splits.every(
    ({ member }) => member === expense.paidBy || paidMembers.includes(member),
  );
}

export function isUserInvolved(expense: Expense, userEmail: string): boolean {
  return expense.splits.some(({ member }) => member === userEmail);
}

/** A member's share of the expense, as the server computed it; 0 when they aren't in the split. */
export function shareOf(expense: Expense, member: string): number {
  return expense.splits.find((split) => split.member === member)?.shareAmount ?? 0;
}

/** What the payer is still owed: the shares of everyone else in the split whose payment isn't confirmed. */
export function stillOwedToPayer(expense: Expense): number {
  const paidMembers = expense.paidMembers || [];
  const cents = expense.splits
    .filter(({ member }) => member !== expense.paidBy && !paidMembers.includes(member))
    .reduce((sum, split) => sum + toCents(split.shareAmount), 0);
  return fromCents(cents);
}

/** How much the user still owes, and how much others still owe the user (summed in centavos, so no float drift). */
export function calculateUnsettledStats(unsettledExpenses: Expense[], userEmail: string) {
  let oweCents = 0;
  let owedCents = 0;

  for (const expense of unsettledExpenses) {
    if (expense.paidBy === userEmail) {
      owedCents += toCents(stillOwedToPayer(expense));
    } else if (!expense.paidMembers?.includes(userEmail)) {
      oweCents += toCents(shareOf(expense, userEmail));
    }
  }

  return { youOwe: fromCents(oweCents), youAreOwed: fromCents(owedCents) };
}

/** Splits expenses into the lists shown on each tab (settled/unsettled only include the user's own). */
export function partitionExpenses(expenses: Expense[], userEmail: string) {
  const unsettled = expenses.filter(
    (expense) => !isExpenseSettled(expense) && isUserInvolved(expense, userEmail),
  );
  const settled = expenses.filter(
    (expense) => isExpenseSettled(expense) && isUserInvolved(expense, userEmail),
  );
  return { unsettled, settled };
}

export function filterExpensesForView(
  view: ExpensesView,
  expenses: Expense[],
  partitions: { unsettled: Expense[]; settled: Expense[] },
): Expense[] {
  if (view === "unsettled") return partitions.unsettled;
  if (view === "settled") return partitions.settled;
  if (view === "logs") return [];
  return expenses;
}
