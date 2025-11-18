"use client";
import { Expense, Activity } from "@/src/shared/types";
import { CheckCircle, Link2, User } from "lucide-react";
import React from "react";
import api from "@/lib/axios";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";

interface IExpensesListProps {
  expenses: Expense[];
  members: string[];
  memberNames?: Record<string, string>; // email -> name mapping
  memberMetadata?: Record<string, { joinedAt: string; name?: string; imageUrl?: string }>; // email -> metadata with imageUrl
  tripId: string;
  groupId: string;
  activities?: Activity[]; // activities from the trip
  onDeleteExpense?: (id: string) => void;
  onUpdateExpense?: (expense: Expense) => void;
  onEditExpense?: (expense: Expense) => void;
  onSelectExpense?: (expense: Expense) => void;
  currentUser?: string;
  readOnly?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentLogs?: any[]; // For guest view to calculate settled status
}
const categoryEmojis: Record<string, string> = {
  accommodation: "🏨",
  food: "🍽️",
  transportation: "🚗",
  transport: "🚗", // alias for transportation
  activities: "🎯",
  other: "📌",
};
const ExpensesList = ({
  expenses,
  members,
  memberNames,
  memberMetadata,
  tripId,
  groupId,
  activities = [],
  onDeleteExpense,
  onEditExpense,
  onUpdateExpense,
  onSelectExpense,
  currentUser,
  readOnly = false,
  paymentLogs = [],
}: IExpensesListProps) => {
  const queryClient = useQueryClient();

  // Helper to get activity by id
  const getActivityById = (activityId?: string): Activity | undefined => {
    if (!activityId) return undefined;
    return activities.find((a) => a.id === activityId);
  };

  // Helper function to get display name from email
  const getDisplayName = (email: string): string => {
    return memberNames?.[email] || email.split("@")[0];
  };

  // Helper function to get member avatar
  const getMemberAvatar = (email: string) => {
    return memberMetadata?.[email]?.imageUrl;
  };

  // Helper function to get member initials
  const getMemberInitials = (email: string): string => {
    return email.substring(0, 2).toUpperCase();
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
    if (readOnly) return;

    // Only allow self-marking
    if (memberId !== currentUser) {
      alert("You can only mark yourself as paid");
      return;
    }

    const expense = expenses.find((e) => e.id === expenseId);
    if (!expense) return;

    const paidMembers = expense.paidMembers || [];
    const pendingPayments = expense.pendingPayments || [];
    const paymentStatus = expense.paymentStatusMap?.[memberId];
    
    // Check if already confirmed paid
    const isPaid = paidMembers.includes(memberId);
    // Check if pending
    const isPending = paymentStatus === "pending" || pendingPayments.includes(memberId);
    
    // If already confirmed, allow unmarking
    // If pending, allow unmarking
    // Otherwise, mark as pending
    const shouldMarkPending = !isPaid && !isPending;
    const shouldUnmark = isPaid || isPending;
    
    const newPaidMembers = shouldUnmark
      ? paidMembers.filter((m) => m !== memberId)
      : paidMembers;
    const newPendingPayments = shouldUnmark
      ? pendingPayments.filter((m) => m !== memberId)
      : shouldMarkPending
      ? [...pendingPayments, memberId]
      : pendingPayments;

    // Optimistically update the expense in the cache
    queryClient.setQueryData<{ expenses: Expense[] }>(
      ["expenses", tripId],
      (old) => {
        if (!old) return old;
        return {
          expenses: old.expenses.map((e) => {
            if (e.id !== expenseId) return e;
            const updatedExpense = {
              ...e,
              paidMembers: newPaidMembers,
              pendingPayments: newPendingPayments,
            };
            // Update payment status map
            if (shouldMarkPending) {
              updatedExpense.paymentStatusMap = {
                ...e.paymentStatusMap,
                [memberId]: "pending",
              };
            } else if (shouldUnmark) {
              const { [memberId]: _, ...rest } = e.paymentStatusMap || {};
              updatedExpense.paymentStatusMap = rest;
            }
            return updatedExpense;
          }),
        };
      }
    );

    try {
      await api.post(`/trips/${tripId}/expenses/${expenseId}/payments`, {
        memberEmail: memberId,
        isPaid: shouldMarkPending,
        createPaymentLog: false, // Don't create log until confirmed
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
      alert(
        error instanceof Error
          ? error.message
          : "Failed to mark expense as paid. Please try again."
      );
      console.error("Failed to mark expense as paid:", error);
    }
  };

  // Helper to check if expense is settled (for guest view)
  const isExpenseSettled = (expense: Expense) => {
    if (readOnly && paymentLogs.length > 0) {
      const totalPaid = paymentLogs
        .filter((log) => log.expenseId === expense.id)
        .reduce((sum, log) => sum + log.amount, 0);
      return totalPaid >= expense.amount;
    }
    const splitCount = expense.splitWith?.length || members.length;
    const totalOwed = splitCount - 1; // excluding payer
    return (expense.paidMembers?.length || 0) === totalOwed;
  };

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-2 gap-3 md:gap-4 mb-6'>
        <div className='bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow'>
          <p className='text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide'>
            My Expenses
          </p>
          <p className='text-2xl font-bold text-orange-600 dark:text-orange-400'>
            ₱{myExpenses.toFixed(2)}
          </p>
        </div>
        <div className='bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow'>
          <p className='text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide'>
            Trip Expenses
          </p>
          <p className='text-2xl font-bold text-amber-600 dark:text-amber-400'>
            ₱{totalSpent.toFixed(2)}
          </p>
        </div>
      </div>

      {sortedDates.length === 0 ? (
        <div className='bg-slate-50 rounded-xl p-12 text-center border border-slate-200'>
          <div className='w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <span className='text-3xl'>💰</span>
          </div>
          <p className='text-slate-600 font-medium mb-1'>No expenses yet</p>
          <p className='text-sm text-slate-500'>
            Add your first expense to get started
          </p>
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
                const allPaid = readOnly
                  ? isExpenseSettled(expense)
                  : expense.paidMembers?.length === totalOwed;

                const Component =
                  readOnly && !onSelectExpense ? "div" : "button";
                const onClick = onSelectExpense
                  ? () => onSelectExpense(expense)
                  : undefined;

                return (
                  <Component
                    key={expense.id}
                    onClick={onClick}
                    className={`w-full bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 ${
                      onSelectExpense
                        ? "hover:border-orange-400 dark:hover:border-orange-600 transition-all hover:shadow-md cursor-pointer"
                        : ""
                    }`}
                  >
                    <div className='flex items-start gap-3'>
                      <div className='w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0'>
                        {expense.category
                          ? categoryEmojis[expense.category] || "📌"
                          : "📌"}
                      </div>
                      <div className='flex-1 text-left min-w-0'>
                        <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1'>
                          <h4 className='font-semibold text-sm sm:text-base text-slate-900 dark:text-white truncate'>
                            {expense.description}
                          </h4>
                          <div className='flex items-center gap-2 flex-wrap'>
                            {expense.activityId &&
                              getActivityById(expense.activityId) && (
                                <span
                                  className='text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center gap-1 w-fit'
                                  title={
                                    getActivityById(expense.activityId)?.title
                                  }
                                >
                                  <Link2 className='w-3 h-3' />
                                  <span className='truncate max-w-[120px]'>
                                    {getActivityById(expense.activityId)?.title}
                                  </span>
                                </span>
                              )}
                            {allPaid && (
                              <span className='text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 flex items-center gap-1 w-fit'>
                                <CheckCircle className='w-3 h-3' />
                                Settled
                              </span>
                            )}
                          </div>
                        </div>
                        <div className='flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400'>
                          <span>Paid by</span>
                          <div className='flex items-center gap-1.5'>
                            {getMemberAvatar(expense.paidBy) ? (
                              <div className='relative w-5 h-5 rounded-full overflow-hidden border border-slate-300 flex-shrink-0'>
                                <Image
                                  src={getMemberAvatar(expense.paidBy)!}
                                  alt={getDisplayName(expense.paidBy)}
                                  fill
                                  className='object-cover'
                                />
                              </div>
                            ) : (
                              <div className='w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0'>
                                {getMemberInitials(expense.paidBy)}
                              </div>
                            )}
                            <strong>{getDisplayName(expense.paidBy)}</strong>
                          </div>
                          {paidCount > 0 && totalOwed > 0 && (
                            <span className='ml-1 sm:ml-2 text-emerald-600 dark:text-emerald-400'>
                              • {paidCount}/{totalOwed} paid
                            </span>
                          )}
                        </div>
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
                  </Component>
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
