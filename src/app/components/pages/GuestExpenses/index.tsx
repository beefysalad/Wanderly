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
        <div className='text-center'>
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
    <main className='min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/40 to-amber-50/50 pb-20'>
      <div className='max-w-4xl mx-auto px-4 py-6'>
        <div className='mb-8'>
          <div className='bg-gradient-to-br from-white via-orange-50/50 to-amber-50/30 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 sm:p-8 relative overflow-hidden'>
            <div className='absolute inset-0 bg-white/60 backdrop-blur-md -z-0'></div>
            <div className='relative z-10'>
              <div className='flex items-start gap-4 mb-4'>
                <button
                  onClick={() =>
                    router.push(`/guest/group/${groupId}/trip/${tripId}`)
                  }
                  className='cursor-pointer p-2 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white text-slate-700 transition-all flex items-center justify-center flex-shrink-0'
                  aria-label='Go back'
                >
                  <ArrowLeft className='w-5 h-5' />
                </button>
                <div className='flex-1 min-w-0'>
                  <h1 className='text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-2'>
                    {trip.name} Expenses
                  </h1>
                  <p className='text-sm sm:text-base text-slate-600 flex items-center gap-2 mb-2'>
                    <span className='text-lg'>📅</span>
                    <span>
                      {new Date(trip.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      -{" "}
                      {new Date(trip.endDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
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
          </div>

          <div className='rounded-2xl p-4 sm:p-5 mt-6'>
            <div className='flex flex-col sm:flex-row gap-3'>
              <button
                disabled
                className='flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-slate-200 text-slate-500 cursor-not-allowed opacity-50 font-semibold shadow-md flex items-center justify-center gap-2'
              >
                <span className='text-lg'>➕</span>
                <span>Add Expense</span>
              </button>

              <div className='flex gap-3 flex-1 sm:flex-initial'>
                <button
                  disabled
                  className='flex-1 px-4 py-3 rounded-xl bg-slate-200 text-slate-500 cursor-not-allowed opacity-50 font-medium shadow-sm flex items-center justify-center gap-2'
                >
                  <span className='text-lg'>🚫</span>
                  <span className='hidden sm:inline'>Actions Disabled</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-4 sm:p-6 relative overflow-hidden'>
          <div className='relative z-10'>
            <div className='flex space-x-4 border-b border-slate-200 mb-6'>
              <button
                onClick={() => setExpenseSubTab("unsettled")}
                className={`py-2 px-4 text-sm font-medium ${
                  expenseSubTab === "unsettled"
                    ? "border-b-2 border-orange-500 text-orange-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Unsettled ({unsettledExpenses.length})
              </button>
              <button
                onClick={() => setExpenseSubTab("settled")}
                className={`py-2 px-4 text-sm font-medium ${
                  expenseSubTab === "settled"
                    ? "border-b-2 border-orange-500 text-orange-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Settled ({settledExpenses.length})
              </button>
            </div>

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
          onClose={() => setSelectedExpense(null)}
          readOnly={true}
        />
      )}
    </main>
  );
};

export default GuestExpensesComponent;
