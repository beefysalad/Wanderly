"use client";
import { Trip, Group, Expense } from "@/src/shared/types";
import { ArrowLeft, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useGroupAsGuest } from "@/src/hooks/useGroups";
import { useGuest } from "@/src/hooks/useGuest";
import ExpensesList from "../Expenses/ExpenseList";
import { useExpenses, usePaymentLogs } from "@/src/hooks/useExpenses";
import ExpenseDetailModal from "../../shared/Modal/ExpenseDetailModal";

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
    "unsettled"
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
    (expense) => !isExpenseSettled(expense)
  );
  const settledExpenses = expenses.filter((expense) =>
    isExpenseSettled(expense)
  );

  if (loadingGroup) {
    return (
      <main className='min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/40 to-amber-50/50 flex items-center justify-center'>
        <div className='text-center bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-8'>
          <div className='w-12 h-12 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-700 font-medium'>Loading expenses...</p>
        </div>
      </main>
    );
  }

  if (!trip) {
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
    <main className='min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/40 to-amber-50/50 pb-6'>
      <div className='max-w-4xl mx-auto px-4 py-4 md:py-6'>
        <div className='mb-8'>
          {/* Header Card with Integrated Back Button */}
          <div className='bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6 mb-6'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex items-start gap-4 flex-1 min-w-0'>
                <button
                  onClick={() =>
                    router.push(`/guest/group/${groupId}/trip/${tripId}`)
                  }
                  className='p-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-all flex items-center justify-center flex-shrink-0'
                  aria-label='Go back'
                >
                  <ArrowLeft className='w-5 h-5' />
                </button>
                <div className='flex-1 min-w-0'>
                  <h1 className='text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-2'>
                    Expenses
                  </h1>
                  <p className='text-sm text-slate-600 flex items-center gap-2 mb-2'>
                    <span className='text-lg'>📅</span>
                    <span>{trip.name}</span>
                  </p>
                  {guestSession && (
                    <p className='text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-lg inline-flex items-center gap-2 mt-2'>
                      <Users className='w-4 h-4' />
                      Viewing as Guest: {guestSession.guestName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className='mt-4 flex items-center gap-2 overflow-x-auto pb-1'>
              <button
                onClick={() => setExpenseSubTab("unsettled")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                  expenseSubTab === "unsettled"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Unsettled ({unsettledExpenses.length})
              </button>
              <button
                onClick={() => setExpenseSubTab("settled")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                  expenseSubTab === "settled"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Settled ({settledExpenses.length})
              </button>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6'>
          <div className='relative z-10'>

            {loadingExpenses || loadingPaymentLogs ? (
              <div className='text-center py-12'>
                <div className='w-12 h-12 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
                <p className='text-slate-600 font-medium'>
                  Loading expenses...
                </p>
              </div>
            ) : (
              <ExpensesList
                tripId={tripId}
                groupId={groupId}
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
