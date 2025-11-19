"use client";
import { Expense, Trip, PaymentLog } from "@/src/shared/types";
import { ArrowLeft, Plus, Receipt, Calendar, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import ExpensesList from "./ExpenseList";
import AddExpenseModal from "../../shared/Modal/AddExpenseModal";
import ExpenseDetailModal from "../../shared/Modal/ExpenseDetailModal";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useGroup } from "@/src/hooks/useGroups";
import { useExpenses, usePaymentLogs, useConfirmPayment } from "@/src/hooks/useExpenses";
import api from "@/lib/axios";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketGroupUpdates } from "@/src/hooks/useSocketGroupUpdates";

interface IExpensesComponent {
  groupId: string;
  tripId: string;
}
const ExpensesComponent = ({ groupId, tripId }: IExpensesComponent) => {
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
    "all"
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
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
    const memberEmail = group?.memberEmails?.find((e) => 
      e === nameOrEmail || e.split("@")[0] === nameOrEmail
    );
    if (memberEmail && group?.memberMetadata?.[memberEmail]) {
      return group.memberMetadata[memberEmail].imageUrl;
    }
    
    // Try to find by name
    const foundEmail = Object.entries(group?.memberNames || {}).find(
      ([email, name]) => name === nameOrEmail
    )?.[0];
    if (foundEmail && group?.memberMetadata?.[foundEmail]) {
      return group.memberMetadata[foundEmail].imageUrl;
    }
    
    return undefined;
  };

  const getMemberInitialsFromLog = (log: PaymentLog, type: "payer" | "payee"): string => {
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
          JSON.stringify(selectedExpense.paymentStatusMap || {}) !== JSON.stringify(updatedExpense.paymentStatusMap || {}) ||
          JSON.stringify(selectedExpense.paidMembers || []) !== JSON.stringify(updatedExpense.paidMembers || []) ||
          JSON.stringify(selectedExpense.pendingPayments || []) !== JSON.stringify(updatedExpense.pendingPayments || []);
        
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
      (member) => member === expense.paidBy || paidMembers.includes(member)
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
    isUserInvolved(exp)
  );
  const settledExpenses = allSettledExpenses.filter((exp) =>
    isUserInvolved(exp)
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
            member !== currentUserEmail && !paidMembers.includes(member)
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
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  };

  const handleConfirmPayment = async (
    expenseId: string,
    memberEmail: string,
    status: "confirmed" | "rejected"
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
      updatedExpense.pendingPayments = (updatedExpense.pendingPayments || []).filter(
        (email) => email !== memberEmail
      );
      if (!updatedExpense.paidMembers?.includes(memberEmail)) {
        updatedExpense.paidMembers = [
          ...(updatedExpense.paidMembers || []),
          memberEmail,
        ];
      }
    } else if (status === "rejected") {
      // Remove from pending
      updatedExpense.pendingPayments = (updatedExpense.pendingPayments || []).filter(
        (email) => email !== memberEmail
      );
      // Remove from paidMembers if it was there
      updatedExpense.paidMembers = (updatedExpense.paidMembers || []).filter(
        (email) => email !== memberEmail
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
        }
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
          : "Failed to confirm payment. Please try again."
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
            e.id === expenseId ? { ...e, paidMembers: newPaidMembers } : e
          ),
        };
      }
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
              e.id === expenseId ? expense : e
            ),
          };
        }
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

  const handleAddExpense = () => {
    // This is handled by AddExpenseModal
    setShowAddModal(false);
    setEditingExpense(null);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingExpense(null);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowAddModal(true);
  };

  if (loadingGroup) {
    return (
      <main className='min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/40 to-amber-50/50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-12 h-12 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-700 font-medium'>Loading expenses...</p>
        </div>
      </main>
    );
  }

  if (!group || !trip) {
    return (
      <main className='min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/40 to-amber-50/50 flex items-center justify-center p-4'>
        <div className='text-center bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-8 max-w-md'>
          <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <span className='text-3xl'>😞</span>
          </div>
          <h2 className='text-xl font-bold text-slate-900 mb-2'>
            Trip Not Found
          </h2>
          <p className='text-slate-600 mb-6'>
            This trip doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={() => router.push(`/group/${groupId}/trip/${tripId}`)}
            className='px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg'
          >
            Go Back to Trip
          </button>
        </div>
      </main>
    );
  }
  return (
    <>
      <main className='min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/40 to-amber-50/50 pb-6'>
        <div className='max-w-4xl mx-auto px-4 py-4 md:py-6'>
          <div className='mb-8'>
            {/* Header Card with Integrated Back Button and Actions */}
            <div className='bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6 mb-6'>
              <div className='flex items-start justify-between gap-4'>
                <div className='flex items-start gap-4 flex-1 min-w-0'>
                  <button
                    onClick={() => router.back()}
                    className='p-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-all flex items-center justify-center flex-shrink-0'
                    aria-label='Go back'
                  >
                    <ArrowLeft className='w-5 h-5' />
                  </button>
                  <div className='flex-1 min-w-0'>
                    <h1 className='text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-2'>
                      Expenses
                    </h1>
                    <p className='text-sm text-slate-600 flex items-center gap-2'>
                      <Calendar className='w-4 h-4 text-orange-500' />
                      <span>{trip.name}</span>
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2 flex-shrink-0'>
                  <button
                    onClick={() => setView("logs")}
                    className={`p-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center active:scale-[0.95] transform ${
                      view === "logs"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                        : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                    aria-label='Payment logs'
                  >
                    <Receipt className='w-5 h-5' />
                  </button>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className='p-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white transition-all shadow-md hover:shadow-lg flex items-center justify-center flex-shrink-0 active:scale-[0.95] transform'
                    aria-label='Add expense'
                  >
                    <Plus className='w-5 h-5' />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className='mt-4 flex items-center gap-2 overflow-x-auto pb-1'>
                <button
                  onClick={() => setView("all")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                    view === "all"
                      ? "bg-orange-500 text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      view === "all" ? "bg-white" : "bg-slate-400"
                    }`}
                  ></div>
                  <span>All Expenses ({expenses.length})</span>
                </button>
                <button
                  onClick={() => setView("unsettled")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                    view === "unsettled"
                      ? "bg-red-500 text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      view === "unsettled" ? "bg-white" : "bg-red-400"
                    }`}
                  ></div>
                  <span>Unsettled ({unsettledExpenses.length})</span>
                </button>
                <button
                  onClick={() => setView("settled")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                    view === "settled"
                      ? "bg-emerald-500 text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      view === "settled" ? "bg-white" : "bg-emerald-400"
                    }`}
                  ></div>
                  <span>Settled ({settledExpenses.length})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content Area Card */}
          <div className='bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6'>
            {view === "logs" ? (
              loadingLogs ? (
                <div className='text-center py-12'>
                  <div className='w-12 h-12 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
                  <p className='text-slate-600 font-medium'>
                    Loading payment logs...
                  </p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {paymentLogs.length === 0 ? (
                    <div className='bg-slate-50 rounded-xl p-8 text-center border border-slate-200'>
                      <Receipt className='w-16 h-16 text-slate-300 mx-auto mb-3' />
                      <p className='text-slate-600 font-medium mb-1'>
                        No payment logs yet
                      </p>
                      <p className='text-sm text-slate-500'>
                        Payment history will appear here
                      </p>
                    </div>
                  ) : (
                    paymentLogs
                      .sort(
                        (a, b) =>
                          new Date(b.timestamp).getTime() -
                          new Date(a.timestamp).getTime()
                      )
                      .map((log) => (
                        <div
                          key={log.id}
                          className='bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow'
                        >
                          <div className='flex items-start justify-between gap-4'>
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center gap-2 mb-2'>
                                <span className='text-xl flex-shrink-0'>
                                  {log.paymentMethod === "cash" && "💵"}
                                  {log.paymentMethod === "bank" && "🏦"}
                                  {log.paymentMethod === "maya" && "💳"}
                                  {log.paymentMethod === "gcash" && "💰"}
                                  {!log.paymentMethod && "💵"}
                                </span>
                                <div className='flex-1 min-w-0'>
                                  <p className='font-semibold text-slate-900 truncate'>
                                    {log.expenseDescription}
                                  </p>
                                  <p className='text-xs text-slate-500'>
                                    {new Date(log.timestamp).toLocaleString(
                                      "en-US",
                                      {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                        hour: "numeric",
                                        minute: "2-digit",
                                      }
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className='flex items-center gap-2 text-sm flex-wrap'>
                                <div className='flex items-center gap-1.5'>
                                  {getMemberAvatarFromLog(log, "payer") ? (
                                    <div className='relative w-5 h-5 rounded-full overflow-hidden border border-slate-300 flex-shrink-0'>
                                      <Image
                                        src={getMemberAvatarFromLog(log, "payer")!}
                                        alt={log.payer.split("@")[0]}
                                        fill
                                        className='object-cover'
                                      />
                                    </div>
                                  ) : (
                                    <div className='w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0'>
                                      {getMemberInitialsFromLog(log, "payer")}
                                    </div>
                                  )}
                                  <span className='font-medium text-slate-700 truncate'>
                                    {log.payer.split("@")[0]}
                                  </span>
                                </div>
                                <span className='text-slate-400'>→</span>
                                <div className='flex items-center gap-1.5'>
                                  {getMemberAvatarFromLog(log, "payee") ? (
                                    <div className='relative w-5 h-5 rounded-full overflow-hidden border border-slate-300 flex-shrink-0'>
                                      <Image
                                        src={getMemberAvatarFromLog(log, "payee")!}
                                        alt={log.payee.split("@")[0]}
                                        fill
                                        className='object-cover'
                                      />
                                    </div>
                                  ) : (
                                    <div className='w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0'>
                                      {getMemberInitialsFromLog(log, "payee")}
                                    </div>
                                  )}
                                  <span className='font-medium text-slate-700 truncate'>
                                    {log.payee.split("@")[0]}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className='text-right flex-shrink-0'>
                              <p className='text-lg font-bold text-emerald-600'>
                                ₱{log.amount.toFixed(2)}
                              </p>
                              <span className='inline-block px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium mt-1'>
                                Paid
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )
            ) : loadingExpenses ? (
              <div className='text-center py-12'>
                <div className='w-12 h-12 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
                <p className='text-slate-600 font-medium'>
                  Loading expenses...
                </p>
              </div>
            ) : (
              <>
                {/* Summary Statistics for Unsettled Tab */}
                {view === "unsettled" && (
                  <div className='mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className='bg-red-50 border border-red-200 rounded-xl p-4'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='text-sm font-medium text-red-700 mb-1'>
                            You Owe
                          </p>
                          <p className='text-2xl font-bold text-red-900'>
                            ₱{unsettledStats.youOwe.toFixed(2)}
                          </p>
                        </div>
                        <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center'>
                          <span className='text-2xl'>📤</span>
                        </div>
                      </div>
                    </div>
                    <div className='bg-emerald-50 border border-emerald-200 rounded-xl p-4'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='text-sm font-medium text-emerald-700 mb-1'>
                            You&apos;re Owed
                          </p>
                          <p className='text-2xl font-bold text-emerald-900'>
                            ₱{unsettledStats.youAreOwed.toFixed(2)}
                          </p>
                        </div>
                        <div className='w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center'>
                          <span className='text-2xl'>📥</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary Statistics for Settled Tab */}
                {view === "settled" && (
                  <div className='mb-6'>
                    <div className='bg-slate-50 border border-slate-200 rounded-xl p-4'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='text-sm font-medium text-slate-700 mb-1'>
                            Total Settled
                          </p>
                          <p className='text-2xl font-bold text-slate-900'>
                            ₱{settledStats.totalSettled.toFixed(2)}
                          </p>
                        </div>
                        <div className='w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center'>
                          <span className='text-2xl'>✓</span>
                        </div>
                      </div>
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
                  onSelectExpense={setSelectedExpense}
                  currentUser={user?.email ?? ""}
                />
              </>
            )}
          </div>
        </div>
      </main>

      {/* Render modals outside main to avoid container constraints */}
      {showAddModal && trip && (
        <AddExpenseModal
          tripId={tripId}
          groupId={groupId}
          members={group.memberEmails || []}
          memberNames={group.memberNames}
          activities={trip.activities || []}
          onAddExpense={handleAddExpense}
          onClose={handleCloseModal}
          editingExpense={editingExpense || undefined}
        />
      )}

      {selectedExpense && trip && (
        <ExpenseDetailModal
          expense={selectedExpense}
          members={group.memberEmails || []}
          memberNames={group.memberNames}
          memberMetadata={group.memberMetadata}
          activities={trip.activities || []}
          onClose={() => setSelectedExpense(null)}
          onMarkPaid={(memberId) => {
            handleMarkPaid(selectedExpense.id, memberId);
          }}
          onConfirmPayment={(memberEmail, status) => {
            handleConfirmPayment(selectedExpense.id, memberEmail, status);
          }}
          onEdit={() => {
            setEditingExpense(selectedExpense);
            setSelectedExpense(null);
            setShowAddModal(true);
          }}
          onDelete={() => {
            handleDeleteExpense(selectedExpense.id);
            setSelectedExpense(null);
          }}
          currentUser={user?.email ?? ""}
        />
      )}
    </>
  );
};

export default ExpensesComponent;
