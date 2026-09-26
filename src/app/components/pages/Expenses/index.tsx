"use client";
import { useState } from "react";
import type { Trip } from "@/src/shared/types";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useExpenses, usePaymentLogs } from "@/src/hooks/useExpenses";
import { useGroup } from "@/src/hooks/useGroups";
import { useSocketGroupUpdates } from "@/src/hooks/useSocketGroupUpdates";
import LoadingState from "../../shared/LoadingState";
import { CategoryBars } from "./CategoryBars";
import { ExpenseFilters } from "./ExpenseFilters";
import { ExpenseRow } from "./ExpenseRow";
import { ExpenseSummary } from "./ExpenseSummary";
import { PaymentHistory } from "./components/PaymentHistory";
import { calculateUnsettledStats, filterExpensesForView, partitionExpenses, type ExpensesView } from "./expenseStats";

interface IExpensesComponent {
  groupId: string;
  tripId: string;
}

/** The Expenses tab of a trip: totals, filters, the list, a category breakdown and the payment history. */
const ExpensesComponent = ({ groupId, tripId }: IExpensesComponent) => {
  const { data: groupData, isLoading: loadingGroup } = useGroup(groupId);
  const { data: expensesData, isLoading: loadingExpenses } = useExpenses(tripId);
  const { data: paymentLogsData, isLoading: loadingLogs } = usePaymentLogs(tripId);
  const { user } = useCurrentUser();
  const [view, setView] = useState<ExpensesView>("all");

  // Enable real-time updates for this group via Socket.IO
  useSocketGroupUpdates(groupId);

  const group = groupData?.group || null;
  const trip = group?.trips?.find((t: Trip) => t.id === tripId) || null;
  const expenses = expensesData?.expenses || [];
  const email = user?.email || "";

  if (loadingGroup || loadingExpenses) return <LoadingState className='py-20' />;
  if (!group || !trip) return <p className='py-16 text-center text-sm text-[#94a3b8]'>This trip couldn&apos;t be found.</p>;

  const partitions = partitionExpenses(expenses, email);
  const { youOwe, youAreOwed } = calculateUnsettledStats(partitions.unsettled, email);
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const shown = filterExpensesForView(view, expenses, partitions);

  return (
    <div className='flex flex-col gap-[18px]'>
      <ExpenseSummary youOwe={youOwe} youAreOwed={youAreOwed} total={total} />
      <ExpenseFilters
        view={view}
        onChange={setView}
        counts={{ all: expenses.length, unsettled: partitions.unsettled.length, settled: partitions.settled.length }}
        addHref={`/group/${groupId}/expenses/add?tripId=${tripId}`}
      />

      {view === "logs" ? (
        <PaymentHistory group={group} paymentLogs={paymentLogsData?.paymentLogs || []} isLoading={loadingLogs} />
      ) : null}

      {view === "analysis" ? <CategoryBars expenses={expenses} /> : null}

      {view !== "logs" && view !== "analysis" ? (
        <div className='flex flex-col gap-2'>
          {shown.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              group={group}
              userEmail={email}
              href={`/group/${groupId}/expenses/${expense.id}?tripId=${tripId}`}
            />
          ))}
          {shown.length === 0 ? (
            <div className='rounded-[18px] border border-dashed border-white/[.14] p-7 text-center text-sm text-[#94a3b8]'>
              No expenses here yet.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default ExpensesComponent;
