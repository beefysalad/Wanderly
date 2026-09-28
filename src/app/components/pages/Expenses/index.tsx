"use client";
import { useState } from "react";
import type { Trip } from "@/src/shared/types";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useExpenses, usePaymentLogs } from "@/src/hooks/useExpenses";
import { useGroup, useGroupAsGuest } from "@/src/hooks/useGroups";
import LoadingState from "../../shared/LoadingState";
import { StateMessage } from "../../shared/StateMessage";
import { blockingQuery } from "../../shared/StateMessage/loadError";
import { CategoryBars } from "./CategoryBars";
import { ExpenseFilters } from "./ExpenseFilters";
import { ExpenseRow } from "./ExpenseRow";
import { ExpenseSummary } from "./ExpenseSummary";
import { PaymentHistory } from "./components/PaymentHistory";
import { calculateUnsettledStats, filterExpensesForView, partitionExpenses, type ExpensesView } from "./expenseStats";

interface IExpensesComponent {
  groupId: string;
  tripId: string;
  /** Someone peeking in with a group code: read-only, and the rows open the guest expense page. */
  guest?: boolean;
}

/** The Expenses tab of a trip: totals, filters, the list, a category breakdown and the payment history. */
const ExpensesComponent = ({ groupId, tripId, guest = false }: IExpensesComponent) => {
  const memberGroupQuery = useGroup(guest ? null : groupId);
  const guestGroupQuery = useGroupAsGuest(guest ? groupId : null);
  const expensesQuery = useExpenses(tripId);
  const { data: memberGroup, isLoading: loadingMemberGroup } = memberGroupQuery;
  const { data: guestGroup, isLoading: loadingGuestGroup } = guestGroupQuery;
  const { data: expensesData, isLoading: loadingExpenses } = expensesQuery;
  const { data: paymentLogsData, isLoading: loadingLogs } = usePaymentLogs(tripId);
  const { user } = useCurrentUser();
  const [view, setView] = useState<ExpensesView>("all");

  // Real-time updates for this group are subscribed once by the page container
  // (Trip/GuestTrip) that renders this tab — see useSocketGroupUpdates for why a
  // second subscription here would double every toast and churn the socket room.

  const group = (guest ? guestGroup : memberGroup?.group) || null;
  const loadingGroup = guest ? loadingGuestGroup : loadingMemberGroup;
  const trip = group?.trips?.find((t: Trip) => t.id === tripId) || null;
  const expenses = expensesData?.expenses || [];
  const email = user?.email || "";

  if (loadingGroup || loadingExpenses) return <LoadingState className='py-20' />;
  const failed = blockingQuery(guest ? guestGroupQuery : memberGroupQuery, expensesQuery);
  if (failed) {
    return (
      <StateMessage
        variant='error'
        query={failed}
        what="this trip's expenses"
        signInHref={guest ? "/guest/join" : undefined}
      />
    );
  }
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
        addHref={guest ? undefined : `/group/${groupId}/expenses/add?tripId=${tripId}`}
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
              href={`${guest ? "/guest" : ""}/group/${groupId}/expenses/${expense.id}?tripId=${tripId}`}
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
