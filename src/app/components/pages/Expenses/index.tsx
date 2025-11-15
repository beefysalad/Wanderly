"use client";
import { Expense, Trip } from "@/src/shared/types";
import { ArrowLeft, Plus, Receipt } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import ExpensesList from "./ExpenseList";
import AddExpenseModal from "../../shared/Modal/AddExpenseModal";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useGroup } from "@/src/hooks/useGroups";
import { useExpenses, usePaymentLogs } from "@/src/hooks/useExpenses";
import api from "@/lib/axios";
import { useQueryClient } from "@tanstack/react-query";

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
  const [activeTab, setActiveTab] = useState<"expenses" | "logs">("expenses");
  const [expenseSubTab, setExpenseSubTab] = useState<"unsettled" | "settled">(
    "unsettled"
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const { user } = useCurrentUser();

  // Filter expenses by settled status
  const isExpenseSettled = (expense: Expense) => {
    const splitWith = expense.splitWith || [];
    const paidMembers = expense.paidMembers || [];
    // An expense is settled if all members who should split have paid (or are the payer)
    return splitWith.every(
      (member) => member === expense.paidBy || paidMembers.includes(member)
    );
  };

  const unsettledExpenses = expenses.filter((exp) => !isExpenseSettled(exp));
  const settledExpenses = expenses.filter((exp) => isExpenseSettled(exp));

  const loading = loadingGroup || loadingExpenses || loadingLogs;

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

  if (loading) {
    return (
      <main className='min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-600 dark:text-slate-400'>Loading...</p>
        </div>
      </main>
    );
  }

  if (!group || !trip) {
    return (
      <main className='min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4'>
        <div className='text-center'>
          <p className='text-slate-600 dark:text-slate-400'>Trip not found</p>
        </div>
      </main>
    );
  }
  return (
    <main className='min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4'>
      <div className='max-w-2xl mx-auto py-6'>
        <div className='mb-8'>
          <div className='flex items-center gap-4 mb-4'>
            <button
              onClick={() => router.back()}
              className='p-2 hover:bg-slate-200 rounded-lg transition-colors'
            >
              <ArrowLeft className='w-5 h-5 text-slate-700' />
            </button>
            <div>
              <h1 className='text-3xl font-bold text-slate-900'>Expenses</h1>
              <p className='text-sm text-slate-600'>{trip.name}</p>
            </div>
          </div>

          <div className='flex gap-2 mb-4'>
            <button
              onClick={() => setActiveTab("expenses")}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "expenses"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === "logs"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Receipt className='w-4 h-4' />
              Logs ({paymentLogs.length})
            </button>
          </div>

          {activeTab === "expenses" && (
            <>
              <div className='flex gap-2 mb-4'>
                <button
                  onClick={() => setExpenseSubTab("unsettled")}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    expenseSubTab === "unsettled"
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                      : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Unsettled ({unsettledExpenses.length})
                </button>
                <button
                  onClick={() => setExpenseSubTab("settled")}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    expenseSubTab === "settled"
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                      : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Settled ({settledExpenses.length})
                </button>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className='px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all text-sm font-medium flex items-center gap-2 shadow-md'
              >
                <Plus className='w-4 h-4' />
                Add Expense
              </button>
            </>
          )}
        </div>

        {activeTab === "expenses" ? (
          <ExpensesList
            expenses={
              expenseSubTab === "settled" ? settledExpenses : unsettledExpenses
            }
            members={group.memberEmails || []}
            tripId={tripId}
            groupId={groupId}
            onDeleteExpense={handleDeleteExpense}
            onUpdateExpense={handleUpdateExpense}
            onEditExpense={handleEditExpense}
            currentUser={user?.email ?? ""}
          />
        ) : (
          <div className='space-y-3'>
            {paymentLogs.length === 0 ? (
              <div className='bg-white rounded-xl p-8 text-center'>
                <Receipt className='w-16 h-16 text-slate-300 mx-auto mb-3' />
                <p className='text-slate-500 font-medium'>
                  No payment logs yet
                </p>
                <p className='text-sm text-slate-400 mt-1'>
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
                    className='bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow'
                  >
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-2'>
                          <span className='text-2xl'>
                            {log.paymentMethod === "cash" && "💵"}
                            {log.paymentMethod === "bank" && "🏦"}
                            {log.paymentMethod === "maya" && "💳"}
                            {log.paymentMethod === "gcash" && "💰"}
                            {!log.paymentMethod && "💵"}
                          </span>
                          <div>
                            <p className='font-semibold text-slate-900'>
                              {log.expenseDescription}
                            </p>
                            <p className='text-xs text-slate-500'>
                              {new Date(log.timestamp).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className='flex items-center gap-2 text-sm'>
                          <span className='font-medium text-slate-700'>
                            {log.payer}
                          </span>
                          <span className='text-slate-400'>→</span>
                          <span className='font-medium text-slate-700'>
                            {log.payee}
                          </span>
                        </div>
                      </div>
                      <div className='text-right'>
                        <p className='text-lg font-bold text-emerald-600'>
                          ₱{log.amount.toFixed(2)}
                        </p>
                        <span className='inline-block px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium'>
                          Paid
                        </span>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddExpenseModal
          tripId={tripId}
          groupId={groupId}
          members={group.memberEmails || []}
          onAddExpense={handleAddExpense}
          onClose={handleCloseModal}
          editingExpense={editingExpense || undefined}
        />
      )}
    </main>
  );
};

export default ExpensesComponent;
