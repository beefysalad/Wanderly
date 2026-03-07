"use client";
import { Expense, Activity } from "@/src/shared/types";
import { CheckCircle, Link2, User, Clock, AlertCircle } from "lucide-react";
import React from "react";
import Image from "next/image";

interface IExpensesListProps {
  expenses: Expense[];
  members: string[];
  memberNames?: Record<string, string>; // email -> name mapping
  memberMetadata?: Record<
    string,
    { joinedAt: string; name?: string; imageUrl?: string }
  >; // email -> metadata with imageUrl
  activities?: Activity[]; // activities from the trip
  onSelectExpense?: (expense: Expense) => void;
  onSelectActivity?: (activity: Activity) => void;
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
  activities = [],
  onSelectExpense,
  onSelectActivity,
  currentUser,
  readOnly = false,
  paymentLogs = [],
}: IExpensesListProps) => {
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

  const groupedExpenses = expenses.reduce(
    (acc, expense) => {
      // Format date specifically for display
      const dateObj = new Date(expense.date);
      const dateKey = dateObj.toISOString().split("T")[0]; // Use ISO string key for sorting

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(expense);
      return acc;
    },
    {} as Record<string, Expense[]>,
  );

  // Sort dates descending
  const sortedDateKeys = Object.keys(groupedExpenses).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const myExpenses = expenses
    .filter((exp) => exp.splitWith?.includes(currentUser || ""))
    .reduce((sum, exp) => {
      const splitCount = exp.splitWith?.length || members.length;
      return sum + exp.amount / splitCount;
    }, 0);

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
      <div className='grid grid-cols-2 gap-2 md:gap-4 mb-6'>
        <div className='bg-slate-800/40 backdrop-blur-md rounded-2xl p-3 md:p-5 border border-white/5 hover:border-orange-500/20 transition-all hover:bg-slate-800/60 group'>
          <p className='text-xs font-bold text-slate-400 mb-1 md:mb-2 uppercase tracking-widest flex items-center gap-1 md:gap-2'>
            <User className='w-3 h-3 text-orange-400' />
            <span className='hidden sm:inline'>My Expenses</span>
            <span className='sm:hidden'>My</span>
          </p>
          <p className='text-xl md:text-2xl lg:text-3xl font-bold text-orange-400 group-hover:scale-105 transition-transform origin-left truncate'>
            ₱{myExpenses.toFixed(2)}
          </p>
        </div>
        <div className='bg-slate-800/40 backdrop-blur-md rounded-2xl p-3 md:p-5 border border-white/5 hover:border-amber-500/20 transition-all hover:bg-slate-800/60 group'>
          <p className='text-xs font-bold text-slate-400 mb-1 md:mb-2 uppercase tracking-widest flex items-center gap-1 md:gap-2'>
            <Clock className='w-3 h-3 text-amber-400' />
            <span className='hidden sm:inline'>Total Trip</span>
            <span className='sm:hidden'>Total</span>
          </p>
          <p className='text-xl md:text-2xl lg:text-3xl font-bold text-amber-400 group-hover:scale-105 transition-transform origin-left truncate'>
            ₱{totalSpent.toFixed(2)}
          </p>
        </div>
      </div>

      {sortedDateKeys.length === 0 ? (
        <div className='bg-slate-900/30 border border-dashed border-slate-700 rounded-3xl p-12 text-center h-64 flex flex-col items-center justify-center'>
          <div className='w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 group hover:bg-slate-700 transition-colors'>
            <span className='text-3xl group-hover:scale-110 transition-transform'>
              💰
            </span>
          </div>
          <p className='text-slate-300 font-bold text-lg mb-1'>
            No expenses yet
          </p>
          <p className='text-sm text-slate-500'>
            Add your first expense to get started
          </p>
        </div>
      ) : (
        sortedDateKeys.map((dateKey) => {
          const dateObj = new Date(dateKey);
          const displayDate = dateObj.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          });
          const displayYear =
            dateObj.getFullYear() !== new Date().getFullYear()
              ? dateObj.getFullYear()
              : null;

          return (
            <div
              key={dateKey}
              className='animate-in fade-in slide-in-from-bottom-4 duration-500'
            >
              <div className='flex items-baseline gap-2 mb-3 px-1'>
                <h3 className='text-lg font-bold text-white'>{displayDate}</h3>
                {displayYear && (
                  <span className='text-sm font-medium text-slate-500'>
                    {displayYear}
                  </span>
                )}
              </div>

              <div className='space-y-3'>
                {groupedExpenses[dateKey].map((expense) => {
                  const splitCount =
                    expense.splitWith?.length || members.length;
                  const perPersonAmount = expense.amount / splitCount;
                  const totalOwed = splitCount - 1; // excluding payer
                  const allPaid = readOnly
                    ? isExpenseSettled(expense)
                    : expense.paidMembers?.length === totalOwed;

                  const isUserPayer = expense.paidBy === currentUser;
                  const isUserInvolved = expense.splitWith?.includes(
                    currentUser || "",
                  );
                  const userPaid = expense.paidMembers?.includes(
                    currentUser || "",
                  );
                  const userPending = expense.pendingPayments?.includes(
                    currentUser || "",
                  );

                  const Component =
                    readOnly && !onSelectExpense ? "div" : "button";
                  const onClick = onSelectExpense
                    ? () => onSelectExpense(expense)
                    : undefined;

                  return (
                    <Component
                      key={expense.id}
                      onClick={onClick}
                      className={`w-full text-left bg-slate-800/40 backdrop-blur-sm rounded-2xl p-5 border border-white/5 relative overflow-hidden group ${
                        onSelectExpense
                          ? "hover:border-orange-500/30 hover:bg-slate-800/60 hover:shadow-lg hover:shadow-orange-500/5 hover:-translate-y-0.5 transition-all cursor-pointer"
                          : ""
                      }`}
                    >
                      {/* Hover Gradient Overlay */}
                      <div className='absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none' />

                      <div className='flex items-start gap-3 sm:gap-4 relative z-10'>
                        {/* Category Icon */}
                        <div className='w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-white/10 flex items-center justify-center text-xl sm:text-2xl shadow-inner flex-shrink-0 group-hover:scale-105 transition-transform duration-300'>
                          {expense.category
                            ? categoryEmojis[expense.category] || "📌"
                            : "📌"}
                        </div>

                        <div className='flex-1 min-w-0'>
                          <div className='flex flex-col gap-1 mb-2'>
                            <div className='flex items-start justify-between gap-2'>
                              <h4 className='font-bold text-base text-white break-words leading-tight'>
                                {expense.description}
                              </h4>
                              {/* Amount Section - Mobile Optimized Position */}
                              <div className='text-right flex-shrink-0 pl-2'>
                                <p className='text-base font-bold text-white tracking-tight leading-none'>
                                  ₱{expense.amount.toFixed(2)}
                                </p>
                                {splitCount > 1 && (
                                  <p className='text-[10px] sm:text-xs font-medium text-slate-500 mt-0.5'>
                                    ₱{perPersonAmount.toFixed(2)}/p
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Badges moved below title/amount for better mobile layout */}
                            <div className='flex items-center gap-1.5 flex-wrap mt-0.5'>
                              {expense.activityId &&
                                getActivityById(expense.activityId) && (
                                  <span
                                    role='button'
                                    tabIndex={0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const activity = getActivityById(
                                        expense.activityId,
                                      );
                                      if (activity) {
                                        onSelectActivity?.(activity);
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const activity = getActivityById(
                                          expense.activityId,
                                        );
                                        if (activity) {
                                          onSelectActivity?.(activity);
                                        }
                                      }
                                    }}
                                    className='text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1 max-w-full'
                                    title={
                                      getActivityById(expense.activityId)?.title
                                    }
                                  >
                                    <Link2 className='w-3 h-3 flex-shrink-0' />
                                    <span className='truncate'>
                                      {
                                        getActivityById(expense.activityId)
                                          ?.title
                                      }
                                    </span>
                                  </span>
                                )}

                              {allPaid ? (
                                <span className='text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1'>
                                  <CheckCircle className='w-3 h-3 flex-shrink-0' />
                                  Settled
                                </span>
                              ) : (
                                !isUserPayer &&
                                isUserInvolved &&
                                !userPaid &&
                                !userPending && (
                                  <span className='text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1'>
                                    <AlertCircle className='w-3 h-3 flex-shrink-0' />
                                    You Owe
                                  </span>
                                )
                              )}
                            </div>
                          </div>

                          <div className='flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-400 mt-2'>
                            {/* Paid By Section */}
                            <div className='flex items-center gap-2'>
                              <div className='flex items-center gap-1.5 bg-slate-900/60 rounded-full pl-1 pr-2 py-1 border border-white/5'>
                                <span className='text-[10px] font-semibold text-slate-500 uppercase tracking-wide ml-1'>
                                  Paid by
                                </span>
                                {getMemberAvatar(expense.paidBy) ? (
                                  <div className='relative w-4 h-4 rounded-full overflow-hidden border border-slate-600 flex-shrink-0'>
                                    <Image
                                      src={getMemberAvatar(expense.paidBy)!}
                                      alt={getDisplayName(expense.paidBy)}
                                      fill
                                      className='object-cover'
                                    />
                                  </div>
                                ) : (
                                  <div className='w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0'>
                                    {getMemberInitials(expense.paidBy)}
                                  </div>
                                )}
                                <span className='font-semibold text-slate-300 text-xs'>
                                  {isUserPayer
                                    ? "You"
                                    : getDisplayName(expense.paidBy)}
                                </span>
                              </div>
                            </div>

                            {/* Payment Status Bar */}
                            {!allPaid &&
                              (expense.paidMembers?.length || 0) > 0 &&
                              totalOwed > 0 && (
                                <div className='flex items-center gap-1.5 text-[10px] bg-slate-900/40 px-2 py-1 rounded-lg border border-white/5'>
                                  <div className='w-12 h-1 bg-slate-700 rounded-full overflow-hidden'>
                                    <div
                                      className='h-full bg-emerald-500 rounded-full'
                                      style={{
                                        width: `${((expense.paidMembers?.length || 0) / totalOwed) * 100}%`,
                                      }}
                                    />
                                  </div>
                                  <span className='text-emerald-400 font-medium'>
                                    {expense.paidMembers?.length || 0}/
                                    {totalOwed} paid
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    </Component>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ExpensesList;
