"use client";
import { Trip, Expense } from "@/src/shared/types";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useGroupAsGuest } from "@/src/hooks/useGroups";
import { useGuest } from "@/src/hooks/useGuest";
import ExpensesList from "../Expenses/ExpenseList";
import { useExpenses, usePaymentLogs } from "@/src/hooks/useExpenses";
import ExpenseDetailModal from "../../shared/Modal/ExpenseDetailModal";
import { useSocketGroupUpdates } from "@/src/hooks/useSocketGroupUpdates";

interface IGuestExpensesComponent {
  groupId: string;
  tripId: string;
}

const GuestExpensesComponent = ({
  groupId,
  tripId,
}: IGuestExpensesComponent) => {
  const router = useRouter();
  const guestSession = useGuest();

  // Enable real-time updates for this group via Socket.IO
  useSocketGroupUpdates(groupId);

  const { data: groupData, isLoading: loadingGroup } = useGroupAsGuest(groupId);
  const group = groupData || null;
  const trip = group?.trips?.find((t: Trip) => t.id === tripId) || null;

  const { data: expensesData, isLoading: loadingExpenses } =
    useExpenses(tripId);
  const expenses = expensesData?.expenses || [];

  const { data: paymentLogsData, isLoading: loadingPaymentLogs } =
    usePaymentLogs(tripId);
  const paymentLogs = paymentLogsData?.paymentLogs || [];

  const [expenseSubTab, setExpenseSubTab] = useState<"unsettled" | "settled">(
    "unsettled",
  );
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isExpenseSettled = (expense: any) => {
    const totalPaid = paymentLogs
      .filter((log) => log.expenseId === expense.id)
      .reduce((sum, log) => sum + log.amount, 0);
    return totalPaid >= expense.amount;
  };

  const unsettledExpenses = expenses.filter(
    (expense) => !isExpenseSettled(expense),
  );
  const settledExpenses = expenses.filter((expense) =>
    isExpenseSettled(expense),
  );

  if (loadingGroup) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-12 h-12 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-400 font-medium'>Loading expenses...</p>
        </div>
      </main>
    );
  }

  if (!trip) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-4'>
        <div className='text-center bg-slate-800/20 backdrop-blur-xl rounded-2xl shadow-xl border border-white/5 p-8 max-w-md'>
          <div className='w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4'>
            <span className='text-3xl'>😞</span>
          </div>
          <h2 className='text-xl font-bold text-white mb-2'>Trip Not Found</h2>
          <p className='text-slate-400 mb-6'>
            This trip doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={() => router.push(`/guest/group/${groupId}`)}
            className='px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg'
          >
            Go Back to Group
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-slate-950 pb-6 relative overflow-hidden'>
      {/* Background Effects */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]'></div>
        <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[120px]'></div>
      </div>

      <div className='max-w-4xl mx-auto px-4 py-4 md:py-6 relative z-10'>
        <div className='mb-8'>
          {/* Header Navigation */}
          <div className='flex items-center justify-between mb-8'>
            <button
              onClick={() =>
                router.push(`/guest/group/${groupId}/trip/${tripId}`)
              }
              className='p-2 -ml-2 rounded-xl hover:bg-white/5 transition-colors inline-flex items-center gap-2 text-slate-400 hover:text-white group'
            >
              <ArrowLeft className='w-5 h-5 transition-transform group-hover:-translate-x-1' />
              <span className='font-medium'>Back</span>
            </button>

            <div className='flex items-center gap-2'>
              <span className='px-3 py-1 bg-amber-500/10 text-amber-400 rounded-lg text-[10px] font-bold border border-amber-500/20 uppercase tracking-tighter'>
                GUEST VIEW
              </span>
            </div>
          </div>

          <div className='bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 mb-8'>
            <div className='flex flex-col md:flex-row md:items-end justify-between gap-4'>
              <div>
                <div className='flex items-center gap-2 mb-3'>
                  <span className='px-3 py-1 bg-orange-500/10 text-orange-400 rounded-lg text-xs font-bold border border-orange-500/20'>
                    {guestSession?.guestName?.toUpperCase() || "GUEST"}
                  </span>
                </div>
                <h1 className='text-3xl font-bold text-white mb-2 leading-tight'>
                  Trip Expenses
                </h1>
                <p className='text-sm text-slate-400 flex items-center gap-2'>
                  <span className='text-lg'>📅</span>
                  <span>{trip.name}</span>
                </p>
              </div>

              {/* Filter Tabs */}
              <div className='flex items-center gap-1 bg-slate-900/50 p-1 rounded-full border border-white/10'>
                <button
                  onClick={() => setExpenseSubTab("unsettled")}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                    expenseSubTab === "unsettled"
                      ? "bg-amber-500 text-white shadow-lg"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Unsettled ({unsettledExpenses.length})
                </button>
                <button
                  onClick={() => setExpenseSubTab("settled")}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                    expenseSubTab === "settled"
                      ? "bg-amber-500 text-white shadow-lg"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Settled ({settledExpenses.length})
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-8 min-h-[400px]'>
          <div className='relative z-10'>
            {loadingExpenses || loadingPaymentLogs ? (
              <div className='text-center py-12'>
                <div className='w-12 h-12 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
                <p className='text-slate-400 font-medium'>
                  Loading expenses...
                </p>
              </div>
            ) : (
              <ExpensesList
                expenses={
                  expenseSubTab === "unsettled"
                    ? unsettledExpenses
                    : settledExpenses
                }
                paymentLogs={paymentLogs}
                memberNames={group?.memberNames || {}}
                memberMetadata={group?.memberMetadata}
                members={group?.memberEmails || []}
                readOnly={true}
                onSelectExpense={setSelectedExpense}
              />
            )}
          </div>
        </div>
      </div>

      {selectedExpense && (
        <ExpenseDetailModal
          expense={selectedExpense}
          members={group?.memberEmails || []}
          memberNames={group?.memberNames}
          memberMetadata={group?.memberMetadata}
          onClose={() => setSelectedExpense(null)}
          readOnly={true}
        />
      )}
    </main>
  );
};

export default GuestExpensesComponent;
