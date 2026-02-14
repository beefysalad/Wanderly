"use client";
import { Expense, Trip, PaymentLog } from "@/src/shared/types";
import { ArrowLeft, Plus, Receipt, Calendar, User, Wallet } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import ExpensesList from "./ExpenseList";
import ExpenseDetailModal from "../../shared/Modal/ExpenseDetailModal";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useGroup } from "@/src/hooks/useGroups";
import { useExpenses, usePaymentLogs } from "@/src/hooks/useExpenses";
import api from "@/lib/axios";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketGroupUpdates } from "@/src/hooks/useSocketGroupUpdates";

interface IExpensesComponent {
  groupId: string;
  tripId: string;
  isEmbedded?: boolean;
}

const ExpensesComponent = ({
  groupId,
  tripId,
  isEmbedded = false,
}: IExpensesComponent) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: groupData, isLoading: loadingGroup } = useGroup(groupId);
  const { data: expensesData, isLoading: loadingExpenses } =
    useExpenses(tripId);
  const { data: paymentLogsData, isLoading: loadingLogs } =
    usePaymentLogs(tripId);

  const group = groupData?.group || null;
  const trip = group?.trips?.find((t: Trip) => t.id === tripId) || null;
  const expenses = expensesData?.expenses || [];
  const paymentLogs = paymentLogsData?.paymentLogs || [];
  const [view, setView] = useState<"all" | "unsettled" | "settled" | "logs">(
    "all",
  );
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const { user } = useCurrentUser();

  // Enable real-time updates for this group via Socket.IO
  useSocketGroupUpdates(groupId);

  const currentUserEmail = user?.email || "";

  // Helper functions for payment logs
  const getMemberAvatarFromLog = (log: PaymentLog, type: "payer" | "payee") => {
    // First try to use imageUrl from the log itself
    if (type === "payer" && log.payerImageUrl) {
      return log.payerImageUrl;
    }
    if (type === "payee" && log.payeeImageUrl) {
      return log.payeeImageUrl;
    }

    // Fallback to memberMetadata lookup using email
    const email = type === "payer" ? log.payerEmail : log.payeeEmail;
    if (email && group?.memberMetadata?.[email]) {
      return group.memberMetadata[email].imageUrl;
    }

    // Try to find by name or email string
    const nameOrEmail = type === "payer" ? log.payer : log.payee;
    const memberEmail = group?.memberEmails?.find(
      (e) => e === nameOrEmail || e.split("@")[0] === nameOrEmail,
    );
    if (memberEmail && group?.memberMetadata?.[memberEmail]) {
      return group.memberMetadata[memberEmail].imageUrl;
    }

    // Try to find by name
    const foundEmail = Object.entries(group?.memberNames || {}).find(
      ([email, name]) => name === nameOrEmail,
    )?.[0];
    if (foundEmail && group?.memberMetadata?.[foundEmail]) {
      return group.memberMetadata[foundEmail].imageUrl;
    }

    return undefined;
  };

  const getMemberInitialsFromLog = (
    log: PaymentLog,
    type: "payer" | "payee",
  ): string => {
    const nameOrEmail = type === "payer" ? log.payer : log.payee;
    // If it looks like an email, use first 2 chars
    if (nameOrEmail.includes("@")) {
      return nameOrEmail.substring(0, 2).toUpperCase();
    }
    // Otherwise use first letter of each word or first 2 chars
    const parts = nameOrEmail.split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nameOrEmail.substring(0, 2).toUpperCase();
  };

  // Sync selectedExpense with updated expenses data when expenses refetch
  useEffect(() => {
    if (selectedExpense && expenses.length > 0) {
      const updatedExpense = expenses.find((e) => e.id === selectedExpense.id);
      if (updatedExpense) {
        // Only update if payment-related data changed
        const paymentDataChanged =
          JSON.stringify(selectedExpense.paymentStatusMap || {}) !==
            JSON.stringify(updatedExpense.paymentStatusMap || {}) ||
          JSON.stringify(selectedExpense.paidMembers || []) !==
            JSON.stringify(updatedExpense.paidMembers || []) ||
          JSON.stringify(selectedExpense.pendingPayments || []) !==
            JSON.stringify(updatedExpense.pendingPayments || []);

        if (paymentDataChanged) {
          setSelectedExpense(updatedExpense);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses]);

  // Filter expenses by settled status
  const isExpenseSettled = (expense: Expense) => {
    const splitWith = expense.splitWith || [];
    const paidMembers = expense.paidMembers || [];
    // An expense is settled if all members who should split have paid (or are the payer)
    return splitWith.every(
      (member) => member === expense.paidBy || paidMembers.includes(member),
    );
  };

  // Check if user is involved in expense
  const isUserInvolved = (expense: Expense) => {
    return expense.splitWith?.includes(currentUserEmail) || false;
  };

  // Get all unsettled and settled expenses
  const allUnsettledExpenses = expenses.filter((exp) => !isExpenseSettled(exp));
  const allSettledExpenses = expenses.filter((exp) => isExpenseSettled(exp));

  // Filter by user involvement for settled/unsettled tabs
  const unsettledExpenses = allUnsettledExpenses.filter((exp) =>
    isUserInvolved(exp),
  );
  const settledExpenses = allSettledExpenses.filter((exp) =>
    isUserInvolved(exp),
  );

  // Calculate summary statistics
  const calculateUnsettledStats = () => {
    let youOwe = 0;
    let youAreOwed = 0;

    unsettledExpenses.forEach((expense) => {
      const splitWith = expense.splitWith || [];
      const splitCount = splitWith.length || 1;
      const shareAmount = expense.amount / splitCount;
      const paidMembers = expense.paidMembers || [];

      if (expense.paidBy === currentUserEmail) {
        // User paid, calculate what others owe
        const unpaidCount = splitWith.filter(
          (member) =>
            member !== currentUserEmail && !paidMembers.includes(member),
        ).length;
        youAreOwed += shareAmount * unpaidCount;
      } else if (splitWith.includes(currentUserEmail)) {
        // User is in split but didn't pay, check if they've paid
        if (!paidMembers.includes(currentUserEmail)) {
          youOwe += shareAmount;
        }
      }
    });

    return { youOwe, youAreOwed };
  };

  const calculateSettledStats = () => {
    let totalSettled = 0;

    settledExpenses.forEach((expense) => {
      const splitWith = expense.splitWith || [];
      const splitCount = splitWith.length || 1;
      const shareAmount = expense.amount / splitCount;
      totalSettled += shareAmount;
    });

    return { totalSettled };
  };

  const unsettledStats = calculateUnsettledStats();
  const settledStats = calculateSettledStats();

  // Get filtered expenses based on current view
  const getFilteredExpenses = () => {
    if (view === "unsettled") return unsettledExpenses;
    if (view === "settled") return settledExpenses;
    if (view === "logs") return [];
    return expenses; // "all" - show all expenses
  };

  const filteredExpenses = getFilteredExpenses();

  const handleDeleteExpense = async (expenseId: string) => {
    if (!expenseId) return;
    try {
      await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["expenses", tripId] });
      queryClient.invalidateQueries({ queryKey: ["paymentLogs", tripId] });
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      setSelectedExpense(null);
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  };

  const handleConfirmPayment = async (
    expenseId: string,
    memberEmail: string,
    status: "confirmed" | "rejected",
  ) => {
    if (!selectedExpense || selectedExpense.id !== expenseId) return;

    // Optimistically update the selectedExpense
    const previousExpense = selectedExpense;
    const updatedExpense = { ...selectedExpense };

    // Update payment status map
    if (!updatedExpense.paymentStatusMap) {
      updatedExpense.paymentStatusMap = {};
    }
    updatedExpense.paymentStatusMap[memberEmail] = status;

    // Update paidMembers and pendingPayments arrays
    if (status === "confirmed") {
      // Move from pending to confirmed
      updatedExpense.pendingPayments = (
        updatedExpense.pendingPayments || []
      ).filter((email) => email !== memberEmail);
      if (!updatedExpense.paidMembers?.includes(memberEmail)) {
        updatedExpense.paidMembers = [
          ...(updatedExpense.paidMembers || []),
          memberEmail,
        ];
      }
    } else if (status === "rejected") {
      // Remove from pending
      updatedExpense.pendingPayments = (
        updatedExpense.pendingPayments || []
      ).filter((email) => email !== memberEmail);
      // Remove from paidMembers if it was there
      updatedExpense.paidMembers = (updatedExpense.paidMembers || []).filter(
        (email) => email !== memberEmail,
      );
    }

    // Optimistically update the UI
    setSelectedExpense(updatedExpense);

    try {
      const response = await api.post<{ expense: Expense }>(
        `/trips/${tripId}/expenses/${expenseId}/payments/confirm`,
        {
          memberEmail,
          status,
        },
      );

      // Update with the actual response from server
      if (response.data.expense) {
        setSelectedExpense(response.data.expense);
      }

      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["expenses", tripId] });
      queryClient.invalidateQueries({ queryKey: ["paymentLogs", tripId] });
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
    } catch (error) {
      // Revert optimistic update on error
      setSelectedExpense(previousExpense);
      console.error("Failed to confirm payment:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to confirm payment. Please try again.",
      );
    }
  };

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
            e.id === expenseId ? { ...e, paidMembers: newPaidMembers } : e,
          ),
        };
      },
    );

    // Also update selectedExpense if it's the one being modified
    if (selectedExpense?.id === expenseId) {
      setSelectedExpense({
        ...selectedExpense,
        paidMembers: newPaidMembers,
      });
    }

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
              e.id === expenseId ? expense : e,
            ),
          };
        },
      );
      if (selectedExpense?.id === expenseId) {
        setSelectedExpense(expense);
      }
      console.error("Failed to mark expense as paid:", error);
    }
  };

  const handleUpdateExpense = () => {
    // This is handled by the ExpenseList component when marking as paid
    // The actual update is done via API call in ExpenseList
  };

  const handleEditExpense = (expense: Expense) => {
    router.push(
      `/group/${groupId}/expenses/${expense.id}/edit?tripId=${tripId}`,
    );
  };

  if (loadingGroup) {
    if (isEmbedded) {
      return (
        <div className='flex items-center justify-center py-20'>
          <div className='w-8 h-8 border-2 border-slate-700 border-t-orange-500 rounded-full animate-spin mr-3'></div>
          <p className='text-slate-400 font-medium'>Loading expenses...</p>
        </div>
      );
    }
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-12 h-12 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-400 font-medium'>Loading expenses...</p>
        </div>
      </main>
    );
  }

  if (!group || !trip) {
    if (isEmbedded) {
      return (
        <div className='text-center py-10'>
          <p className='text-slate-400'>Trip not found.</p>
        </div>
      );
    }
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-4'>
        <div className='text-center bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-xl border border-white/5 p-8 max-w-md'>
          <div className='w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4'>
            <span className='text-3xl'>😞</span>
          </div>
          <h2 className='text-xl font-bold text-white mb-2'>Trip Not Found</h2>
          <p className='text-slate-400 mb-6'>
            This trip doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={() => router.push(`/group/${groupId}/trip/${tripId}`)}
            className='px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-orange-500/20'
          >
            Go Back to Trip
          </button>
        </div>
      </main>
    );
  }

  const Wrapper = isEmbedded ? "div" : "main";
  const wrapperClass = isEmbedded
    ? ""
    : "min-h-screen bg-slate-950 pb-6 relative overflow-hidden";

  // Shared Tabs Component
  const FilterTabs = () => (
    <div
      className={`flex items-center p-1.5 ${isEmbedded ? "bg-slate-800/40" : "bg-slate-950/50"} rounded-2xl border border-white/5 w-full sm:w-auto overflow-x-auto no-scrollbar`}
    >
      {[
        {
          id: "all",
          label: "All Expenses",
          icon: "📊",
          count: expenses.length,
        },
        {
          id: "unsettled",
          label: "Unsettled",
          icon: "⏳",
          count: unsettledExpenses.length,
        },
        {
          id: "settled",
          label: "Settled",
          icon: "✅",
          count: settledExpenses.length,
        },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setView(tab.id as any)}
          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
            view === tab.id
              ? "bg-slate-700 text-white shadow-lg border border-white/10 scale-[1.02]"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs ${
              view === tab.id
                ? "bg-slate-900 text-slate-300"
                : "bg-slate-800 text-slate-500 group-hover:bg-slate-700"
            }`}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <>
      <Wrapper className={wrapperClass}>
        {/* Background Effects */}
        {!isEmbedded && (
          <div className='fixed inset-0 pointer-events-none'>
            <div className='absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[100px]'></div>
            <div className='absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-500/10 rounded-full blur-[100px]'></div>
          </div>
        )}

        <div
          className={`max-w-4xl mx-auto ${!isEmbedded ? "px-4 py-4 md:py-6" : ""} relative z-10`}
        >
          <div className='mb-8'>
            {/* Header Rendering */}
            {!isEmbedded ? (
              <div className='bg-slate-900/40 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 p-6 mb-6 relative overflow-hidden group/header'>
                <div className='absolute inset-0 bg-gradient-to-br from-orange-500/5 to-purple-500/5 opacity-0 group-hover/header:opacity-100 transition-opacity duration-500'></div>

                <div className='flex items-start justify-between gap-4 relative z-10'>
                  <div className='flex items-start gap-4 flex-1 min-w-0'>
                    <button
                      onClick={() => router.back()}
                      className='p-3 rounded-2xl bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-white/5 hover:border-white/10 flex-shrink-0 group'
                    >
                      <ArrowLeft className='w-5 h-5 transition-transform group-hover:-translate-x-1' />
                    </button>
                    <div className='flex-1 min-w-0'>
                      <h1 className='text-3xl sm:text-4xl font-bold text-white leading-tight mb-2 tracking-tight'>
                        Trip Expenses
                      </h1>
                      <p className='text-sm font-medium text-slate-400 flex items-center gap-2'>
                        <span className='p-1 rounded-md bg-orange-500/10 border border-orange-500/20'>
                          <Wallet className='w-3.5 h-3.5 text-orange-400' />
                        </span>
                        <span>{trip.name}</span>
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2 flex-shrink-0'>
                    <button
                      onClick={() => setView("logs")}
                      className={`p-3 rounded-2xl transition-all border flex items-center justify-center active:scale-95 ${
                        view === "logs"
                          ? "bg-slate-800 border-orange-500/30 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                          : "bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-700 hover:text-white"
                      }`}
                      title='Payment History'
                    >
                      <Receipt className='w-6 h-6' />
                    </button>
                    <Link
                      href={`/group/${groupId}/expenses/add?tripId=${tripId}`}
                      className='p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-lg shadow-orange-500/20 border border-white/10 flex items-center justify-center active:scale-95 transition-all w-12 h-12'
                      title='Add Expense'
                    >
                      <Plus className='w-6 h-6' />
                    </Link>
                  </div>
                </div>

                {/* Filter Tabs - Floating Pill Style */}
                <div className='mt-8'>
                  <FilterTabs />
                </div>
              </div>
            ) : (
              // Embedded Header
              <div className='flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500'>
                <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
                  <FilterTabs />
                  <div className='flex items-center gap-2 self-end sm:self-auto'>
                    <button
                      onClick={() => setView("logs")}
                      className={`px-4 py-2.5 rounded-xl transition-all border flex items-center gap-2 active:scale-95 text-sm font-medium ${
                        view === "logs"
                          ? "bg-slate-800 border-orange-500/30 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                          : "bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      <Receipt className='w-4 h-4' />
                      <span>History</span>
                    </button>
                    {/* Inline Add Expense for desktop context mainly, mobile uses floating FAB */}
                    <Link
                      href={`/group/${groupId}/expenses/add?tripId=${tripId}`}
                      className='hidden sm:flex px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-lg shadow-orange-500/20 border border-white/10 items-center gap-2 active:scale-95 transition-all text-sm font-bold'
                    >
                      <Plus className='w-4 h-4' />
                      <span>Add Expense</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className='space-y-6'>
            {view === "logs" ? (
              loadingLogs ? (
                <div className='text-center py-20'>
                  <div className='w-12 h-12 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
                  <p className='text-slate-400 font-medium'>
                    Loading payment history...
                  </p>
                </div>
              ) : (
                <div className='space-y-4 animate-in fade-in zoom-in-95 duration-300'>
                  <h3 className='text-xl font-bold text-white px-1 flex items-center gap-2'>
                    <Receipt className='w-5 h-5 text-orange-400' />
                    Payment History
                  </h3>

                  {paymentLogs.length === 0 ? (
                    <div className='bg-slate-900/30 border border-dashed border-slate-700 rounded-3xl p-12 text-center'>
                      <div className='w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4'>
                        <Receipt className='w-8 h-8 text-slate-600' />
                      </div>
                      <p className='text-slate-400 font-medium mb-1'>
                        No payment logs yet
                      </p>
                      <p className='text-sm text-slate-600'>
                        Payments and settlements will appear here
                      </p>
                    </div>
                  ) : (
                    <div className='grid gap-3'>
                      {paymentLogs
                        .sort(
                          (a, b) =>
                            new Date(b.timestamp).getTime() -
                            new Date(a.timestamp).getTime(),
                        )
                        .map((log) => (
                          <div
                            key={log.id}
                            className='bg-slate-800/40 backdrop-blur-sm rounded-2xl p-5 border border-white/5 hover:border-orange-500/20 transition-all hover:bg-slate-800/60 group'
                          >
                            <div className='flex items-start justify-between gap-4'>
                              <div className='flex items-start gap-4 flex-1 min-w-0'>
                                <span className='text-2xl mt-1'>
                                  {log.paymentMethod === "cash" && "💵"}
                                  {log.paymentMethod === "bank" && "🏦"}
                                  {log.paymentMethod === "maya" && "💳"}
                                  {log.paymentMethod === "gcash" && "💰"}
                                  {!log.paymentMethod && "💵"}
                                </span>
                                <div className='flex-1 min-w-0'>
                                  <p className='font-bold text-white truncate mb-1 text-lg'>
                                    {log.expenseDescription}
                                  </p>

                                  <div className='flex items-center gap-3 text-sm flex-wrap relative z-10'>
                                    <div className='flex items-center gap-2 bg-slate-900/50 px-2 py-1 rounded-lg border border-white/5'>
                                      {getMemberAvatarFromLog(log, "payer") ? (
                                        <div className='relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0'>
                                          <Image
                                            src={
                                              getMemberAvatarFromLog(
                                                log,
                                                "payer",
                                              )!
                                            }
                                            alt={log.payer.split("@")[0]}
                                            fill
                                            className='object-cover'
                                          />
                                        </div>
                                      ) : (
                                        <div className='w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0'>
                                          {getMemberInitialsFromLog(
                                            log,
                                            "payer",
                                          )}
                                        </div>
                                      )}
                                      <span className='font-medium text-slate-300 truncate max-w-[100px]'>
                                        {log.payer.split("@")[0]}
                                      </span>
                                    </div>

                                    <span className='text-slate-500'>→</span>

                                    <div className='flex items-center gap-2 bg-slate-900/50 px-2 py-1 rounded-lg border border-white/5'>
                                      {getMemberAvatarFromLog(log, "payee") ? (
                                        <div className='relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0'>
                                          <Image
                                            src={
                                              getMemberAvatarFromLog(
                                                log,
                                                "payee",
                                              )!
                                            }
                                            alt={log.payee.split("@")[0]}
                                            fill
                                            className='object-cover'
                                          />
                                        </div>
                                      ) : (
                                        <div className='w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0'>
                                          {getMemberInitialsFromLog(
                                            log,
                                            "payee",
                                          )}
                                        </div>
                                      )}
                                      <span className='font-medium text-slate-300 truncate max-w-[100px]'>
                                        {log.payee.split("@")[0]}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className='text-right flex-shrink-0'>
                                <p className='text-xl font-bold text-emerald-400 tracking-tight'>
                                  ₱{log.amount.toFixed(2)}
                                </p>
                                <p className='text-xs text-slate-500 mt-1'>
                                  {new Date(log.timestamp).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      hour: "numeric",
                                      minute: "2-digit",
                                    },
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )
            ) : loadingExpenses ? (
              <div className='text-center py-20'>
                <div className='w-12 h-12 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
                <p className='text-slate-400 font-medium'>
                  Loading expenses...
                </p>
              </div>
            ) : (
              <div className='animate-in fade-in zoom-in-95 duration-300 space-y-6'>
                {/* Summary Statistics for Unsettled Tab */}
                {view === "unsettled" && (
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className='bg-gradient-to-br from-red-500/10 to-red-900/20 border border-red-500/20 rounded-3xl p-6 relative overflow-hidden group'>
                      <div className='absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity'>
                        <span className='text-6xl'>📤</span>
                      </div>
                      <p className='text-sm font-bold text-red-400 uppercase tracking-widest mb-1'>
                        You Owe
                      </p>
                      <p className='text-3xl sm:text-4xl font-bold text-white tracking-tight'>
                        ₱{unsettledStats.youOwe.toFixed(2)}
                      </p>
                    </div>

                    <div className='bg-gradient-to-br from-emerald-500/10 to-emerald-900/20 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden group'>
                      <div className='absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity'>
                        <span className='text-6xl'>📥</span>
                      </div>
                      <p className='text-sm font-bold text-emerald-400 uppercase tracking-widest mb-1'>
                        You're Owed
                      </p>
                      <p className='text-3xl sm:text-4xl font-bold text-white tracking-tight'>
                        ₱{unsettledStats.youAreOwed.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Summary Statistics for Settled Tab */}
                {view === "settled" && (
                  <div className='bg-slate-800/40 border border-white/5 rounded-3xl p-6 flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-slate-400 mb-1'>
                        Total Settled Amount
                      </p>
                      <p className='text-3xl font-bold text-white tracking-tight'>
                        ₱{settledStats.totalSettled.toFixed(2)}
                      </p>
                    </div>
                    <div className='w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center'>
                      <span className='text-2xl'>✓</span>
                    </div>
                  </div>
                )}

                <ExpensesList
                  expenses={filteredExpenses}
                  members={group.memberEmails || []}
                  memberNames={group.memberNames}
                  memberMetadata={group.memberMetadata}
                  tripId={tripId}
                  groupId={groupId}
                  activities={trip.activities || []}
                  onDeleteExpense={handleDeleteExpense}
                  onUpdateExpense={handleUpdateExpense}
                  onEditExpense={handleEditExpense}
                  onSelectExpense={handleEditExpense}
                  currentUser={user?.email ?? ""}
                />
              </div>
            )}
          </div>
        </div>
      </Wrapper>
    </>
  );
};

export default ExpensesComponent;
