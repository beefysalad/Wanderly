"use client";
import { Expense, Trip } from "@/src/shared/types";
import { useRouter } from "next/navigation";
import ExpensesList from "./ExpenseList";
import ExpenseCharts from "./ExpenseCharts";
import React, { useState } from "react";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useGroup } from "@/src/hooks/useGroups";
import { useExpenses, usePaymentLogs } from "@/src/hooks/useExpenses";
import { useSocketGroupUpdates } from "@/src/hooks/useSocketGroupUpdates";
import LoadingState from "../../shared/LoadingState";
import { ExpensesHeader } from "./components/ExpensesHeader";
import { PaymentHistory } from "./components/PaymentHistory";
import { SettledSummary, UnsettledSummary } from "./components/SummaryCards";
import { TripNotFound } from "./components/TripNotFound";
import {
  calculateSettledStats,
  calculateUnsettledStats,
  filterExpensesForView,
  partitionExpenses,
  type ExpensesView,
} from "./expenseStats";

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
  const { data: groupData, isLoading: loadingGroup } = useGroup(groupId);
  const { data: expensesData, isLoading: loadingExpenses } =
    useExpenses(tripId);
  const { data: paymentLogsData, isLoading: loadingLogs } =
    usePaymentLogs(tripId);

  const group = groupData?.group || null;
  const trip = group?.trips?.find((t: Trip) => t.id === tripId) || null;
  const expenses = expensesData?.expenses || [];
  const paymentLogs = paymentLogsData?.paymentLogs || [];

  const [view, setView] = useState<ExpensesView>("all");
  const { user } = useCurrentUser();

  // Enable real-time updates for this group via Socket.IO
  useSocketGroupUpdates(groupId);

  const currentUserEmail = user?.email || "";

  const partitions = partitionExpenses(expenses, currentUserEmail);
  const unsettledStats = calculateUnsettledStats(partitions.unsettled, currentUserEmail);
  const settledStats = calculateSettledStats(partitions.settled);
  const filteredExpenses = filterExpensesForView(view, expenses, partitions);

  const counts = {
    all: expenses.length,
    unsettled: partitions.unsettled.length,
    settled: partitions.settled.length,
  };

  const handleViewExpense = (expense: Expense) => {
    router.push(`/group/${groupId}/expenses/${expense.id}?tripId=${tripId}`);
  };

  const handleViewActivity = (activityId: string) => {
    router.push(`/group/${groupId}/trip/${tripId}/activities/${activityId}`);
  };

  if (loadingGroup) {
    if (isEmbedded) {
      return <LoadingState className='py-20' />;
    }
    return (
      <main className='min-h-screen bg-slate-950 p-4'>
        <LoadingState fullScreen />
      </main>
    );
  }

  if (!group || !trip) {
    return <TripNotFound isEmbedded={isEmbedded} groupId={groupId} tripId={tripId} />;
  }

  const Wrapper = isEmbedded ? "div" : "main";
  const wrapperClass = isEmbedded
    ? ""
    : "min-h-screen bg-slate-950 pb-6 relative overflow-hidden";

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
            <ExpensesHeader
              isEmbedded={isEmbedded}
              groupId={groupId}
              tripId={tripId}
              tripName={trip.name}
              view={view}
              setView={setView}
              counts={counts}
            />
          </div>

          {/* Content Area */}
          <div className='space-y-6'>
            {view === "logs" ? (
              <PaymentHistory
                group={group}
                paymentLogs={paymentLogs}
                isLoading={loadingLogs}
              />
            ) : loadingExpenses ? (
              <LoadingState className='py-20' />
            ) : (
              <div className='animate-in fade-in zoom-in-95 duration-300 space-y-6'>
                {view === "unsettled" && (
                  <UnsettledSummary
                    youOwe={unsettledStats.youOwe}
                    youAreOwed={unsettledStats.youAreOwed}
                  />
                )}

                {view === "settled" && (
                  <SettledSummary totalSettled={settledStats.totalSettled} />
                )}

                {view === "analysis" && (
                  <ExpenseCharts
                    expenses={expenses}
                    currentUserEmail={user?.email || ""}
                  />
                )}

                {view !== "analysis" && (
                  <ExpensesList
                    expenses={filteredExpenses}
                    members={group.memberEmails || []}
                    memberNames={group.memberNames}
                    memberMetadata={group.memberMetadata}
                    activities={trip.activities || []}
                    onSelectExpense={handleViewExpense}
                    onSelectActivity={(activity) => handleViewActivity(activity.id)}
                    currentUser={user?.email ?? ""}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </Wrapper>
    </>
  );
};

export default ExpensesComponent;
