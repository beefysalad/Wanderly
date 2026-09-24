import type { Expense } from "@/src/shared/types";

export type ExpensesView = "all" | "unsettled" | "settled" | "logs" | "analysis";

/** An expense is settled once every member in the split has paid (or is the payer). */
export function isExpenseSettled(expense: Expense): boolean {
  const splitWith = expense.splitWith || [];
  const paidMembers = expense.paidMembers || [];
  return splitWith.every(
    (member) => member === expense.paidBy || paidMembers.includes(member),
  );
}

export function isUserInvolved(expense: Expense, userEmail: string): boolean {
  return expense.splitWith?.includes(userEmail) || false;
}

/** How much the user still owes, and how much others still owe the user. */
export function calculateUnsettledStats(unsettledExpenses: Expense[], userEmail: string) {
  let youOwe = 0;
  let youAreOwed = 0;

  unsettledExpenses.forEach((expense) => {
    const splitWith = expense.splitWith || [];
    const splitCount = splitWith.length || 1;
    const shareAmount = expense.amount / splitCount;
    const paidMembers = expense.paidMembers || [];

    if (expense.paidBy === userEmail) {
      // User paid, calculate what others owe
      const unpaidCount = splitWith.filter(
        (member) => member !== userEmail && !paidMembers.includes(member),
      ).length;
      youAreOwed += shareAmount * unpaidCount;
    } else if (splitWith.includes(userEmail)) {
      // User is in split but didn't pay, check if they've paid
      if (!paidMembers.includes(userEmail)) {
        youOwe += shareAmount;
      }
    }
  });

  return { youOwe, youAreOwed };
}

export function calculateSettledStats(settledExpenses: Expense[]) {
  let totalSettled = 0;

  settledExpenses.forEach((expense) => {
    const splitCount = (expense.splitWith || []).length || 1;
    totalSettled += expense.amount / splitCount;
  });

  return { totalSettled };
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
