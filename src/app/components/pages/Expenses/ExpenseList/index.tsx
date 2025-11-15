"use client";
import { Expense } from "@/src/shared/types";
import { CheckCircle } from "lucide-react";
import React from "react";
import api from "@/lib/axios";
import { useQueryClient } from "@tanstack/react-query";

interface IExpensesListProps {
  expenses: Expense[];
  members: string[];
  memberNames?: Record<string, string>; // email -> name mapping
  tripId: string;
  groupId: string;
  onDeleteExpense: (id: string) => void;
  onUpdateExpense: (expense: Expense) => void;
  onEditExpense: (expense: Expense) => void;
  onSelectExpense: (expense: Expense) => void;
  currentUser?: string;
}
const categoryEmojis = {
  accommodation: "🏨",
  food: "🍽️",
  transportation: "🚗",
  activities: "🎯",
  other: "📌",
};
const ExpensesList = ({
  expenses,
  members,
  memberNames,
  tripId,
  groupId,
  onDeleteExpense,
  onEditExpense,
  onUpdateExpense,
  onSelectExpense,
  currentUser,
}: IExpensesListProps) => {
  const queryClient = useQueryClient();

  // Helper function to get display name from email
  const getDisplayName = (email: string): string => {
    return memberNames?.[email] || email.split("@")[0];
  };

  const groupedExpenses = expenses.reduce((acc, expense) => {
    const date = new Date(expense.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  const sortedDates = Object.keys(groupedExpenses).sort(
    (a, b) =>
      new Date(groupedExpenses[b][0].date).getTime() -
      new Date(groupedExpenses[a][0].date).getTime()
  );

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const myExpenses = expenses
    .filter((exp) => exp.splitWith?.includes(currentUser || ""))
    .reduce((sum, exp) => {
      const splitCount = exp.splitWith?.length || members.length;
      return sum + exp.amount / splitCount;
    }, 0);

  const handleMarkPaid = async (expenseId: string, memberId: string) => {
    const expense = expenses.find((e) => e.id === expenseId);
    if (!expense) return;

    const paidMembers = expense.paidMembers || [];
    const isPaid = paidMembers.includes(memberId);
    const newPaidMembers = isPaid
      ? paidMembers.filter((m) => m !== memberId)
      : [...paidMembers, memberId];

    // Optimistically update the expense in the cache
    queryClient.setQueryData<{ expenses: Expense[] }>(
      ["expenses", tripId],
      (old) => {
        if (!old) return old;
        return {
          expenses: old.expenses.map((e) =>
            e.id === expenseId ? { ...e, paidMembers: newPaidMembers } : e
          ),
        };
      }
    );

    try {
      await api.post(`/trips/${tripId}/expenses/${expenseId}/payments`, {
        memberEmail: memberId,
        isPaid: !isPaid,
        createPaymentLog: true,
      });

      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["expenses", tripId] });
      queryClient.invalidateQueries({ queryKey: ["paymentLogs", tripId] });
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
    } catch (error) {
      // Revert optimistic update on error
      queryClient.setQueryData<{ expenses: Expense[] }>(
        ["expenses", tripId],
        (old) => {
          if (!old) return old;
          return {
            expenses: old.expenses.map((e) =>
              e.id === expenseId ? expense : e
            ),
          };
        }
      );
      console.error("Failed to mark expense as paid:", error);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-2 gap-4'>
        <div className='bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700'>
          <p className='text-sm text-emerald-600 dark:text-emerald-400 mb-1'>
            My Expenses
          </p>
          <p className='text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
            ₱{myExpenses.toFixed(2)}
          </p>
        </div>
        <div className='bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700'>
          <p className='text-sm text-emerald-600 dark:text-emerald-400 mb-1'>
            Total Trip Expenses
          </p>
          <p className='text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
            ₱{totalSpent.toFixed(2)}
          </p>
        </div>
      </div>

      {sortedDates.length === 0 ? (
        <div className='text-center py-12'>
          <p className='text-slate-500 dark:text-slate-400'>No expenses yet</p>
        </div>
      ) : (
        sortedDates.map((date) => (
          <div key={date}>
            <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
              {date}
            </h3>
            <div className='space-y-2'>
              {groupedExpenses[date].map((expense) => {
                const splitCount = expense.splitWith?.length || members.length;
                const perPersonAmount = expense.amount / splitCount;
                const paidCount = expense.paidMembers?.length || 0;
                const totalOwed = splitCount - 1; // excluding payer
                const allPaid = expense.paidMembers?.length === totalOwed;

                return (
                  <button
                    key={expense.id}
                    onClick={() => onSelectExpense(expense)}
                    className='w-full bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-orange-400 dark:hover:border-orange-600 transition-all hover:shadow-md'
                  >
                    <div className='flex items-start gap-3'>
                      <div className='w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0'>
                        {categoryEmojis[
                          expense.category as keyof typeof categoryEmojis
                        ] || "📌"}
                      </div>
                      <div className='flex-1 text-left min-w-0'>
                        <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1'>
                          <h4 className='font-semibold text-sm sm:text-base text-slate-900 dark:text-white truncate'>
                            {expense.description}
                          </h4>
                          {allPaid && (
                            <span className='text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 flex items-center gap-1 w-fit'>
                              <CheckCircle className='w-3 h-3' />
                              Settled
                            </span>
                          )}
                        </div>
                        <p className='text-xs sm:text-sm text-slate-600 dark:text-slate-400'>
                          Paid by{" "}
                          <strong>{getDisplayName(expense.paidBy)}</strong>
                          {paidCount > 0 && totalOwed > 0 && (
                            <span className='ml-1 sm:ml-2 text-emerald-600 dark:text-emerald-400'>
                              • {paidCount}/{totalOwed} paid
                            </span>
                          )}
                        </p>
                      </div>
                      <div className='text-right flex-shrink-0'>
                        <p className='text-base sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap'>
                          ₱{expense.amount.toFixed(2)}
                        </p>
                        {splitCount > 1 && (
                          <p className='text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap'>
                            ₱{perPersonAmount.toFixed(2)} each
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ExpensesList;
