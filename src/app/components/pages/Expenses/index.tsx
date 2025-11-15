"use client";
import { Expense, Group, PaymentLog, Trip } from "@/src/shared/types";
import { ArrowLeft, Plus, Receipt } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import ExpensesList from "./ExpenseList";
import AddExpenseModal from "../../shared/Modal/AddExpenseModal";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { GROUPS } from "../Dashboard/dummdata";

interface IExpensesComponent {
  groupId: string;
  tripId: string;
}
const ExpensesComponent = ({ groupId, tripId }: IExpensesComponent) => {
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [activeTab, setActiveTab] = useState<"expenses" | "logs">("expenses");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const { user } = useCurrentUser();
  const handleDeleteExpense = () => {
    console.log("DELETE");
  };
  const handleUpdateExpense = () => {
    console.log("DELETE");
  };

  const handleAddExpense = () => {
    console.log("DELETE");
  };
  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingExpense(null);
  };
  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowAddModal(true);
  };

  useEffect(() => {
    const savedGroups = GROUPS;
    if (savedGroups) {
      const groups = savedGroups;
      const foundGroup = groups.find((g: Group) => g.id === groupId);
      if (foundGroup) {
        setGroup(foundGroup);
        const foundTrip = foundGroup.trips?.find((t: Trip) => t.id === tripId);
        if (foundTrip) {
          setTrip(foundTrip);
        }
      }
    }

    const savedExpenses = localStorage.getItem(`expenses-${tripId}`);
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }

    const savedLogs = localStorage.getItem(`payment-logs-${tripId}`);
    if (savedLogs) {
      setPaymentLogs(JSON.parse(savedLogs));
    }

    setLoading(false);
  }, [groupId, tripId, router]);

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
            <button
              onClick={() => setShowAddModal(true)}
              className='px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all text-sm font-medium flex items-center gap-2 shadow-md'
            >
              <Plus className='w-4 h-4' />
              Add Expense
            </button>
          )}
        </div>

        {activeTab === "expenses" ? (
          <ExpensesList
            expenses={expenses}
            members={group.members || []}
            onDeleteExpense={handleDeleteExpense}
            onUpdateExpense={handleUpdateExpense}
            onEditExpense={handleEditExpense}
            currentUser={user?.displayName ?? ""}
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
          members={group.members || []}
          onAddExpense={handleAddExpense}
          onClose={handleCloseModal}
          editingExpense={editingExpense || undefined}
        />
      )}
    </main>
  );
};

export default ExpensesComponent;
