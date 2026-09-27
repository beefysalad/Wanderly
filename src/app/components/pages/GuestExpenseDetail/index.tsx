"use client";

import React from "react";
import ExpenseDetail from "../ExpenseDetail";
import { Trip } from "@/src/shared/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useGroupAsGuest } from "@/src/hooks/useGroups";
import { useExpenses } from "@/src/hooks/useExpenses";
import { GuestShell } from "../../shared/AppShell/GuestShell";
import LoadingState from "../../shared/LoadingState";
import { StateMessage } from "../../shared/StateMessage";
import { blockingQuery } from "../../shared/StateMessage/loadError";

interface IGuestExpenseDetailContainer {
  groupId: string;
  expenseId: string;
}

const GuestExpenseDetailContainer = ({
  groupId,
  expenseId,
}: IGuestExpenseDetailContainer) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = searchParams.get("tripId");

  const groupQuery = useGroupAsGuest(groupId);
  const expensesQuery = useExpenses(tripId);
  const { data: groupData, isLoading: loadingGroup } = groupQuery;
  const { data: expensesData, isLoading: loadingExpenses } = expensesQuery;

  const group = groupData;
  const trip = group?.trips?.find((t: Trip) => t.id === tripId);
  const expense = expensesData?.expenses?.find((e) => e.id === expenseId);

  const back = {
    href: tripId ? `/guest/group/${groupId}/trip/${tripId}?tab=expenses` : `/guest/group/${groupId}`,
    crumb: `${trip?.name ?? group?.name ?? "Trip"} · Expense`,
  };

  if (loadingGroup || (tripId && loadingExpenses)) {
    return (
      <GuestShell group={group} back={back}>
        <LoadingState className='py-24' />
      </GuestShell>
    );
  }

  const failed = blockingQuery(groupQuery, expensesQuery);
  if (failed) {
    return (
      <GuestShell group={group} back={back}>
        <StateMessage variant='error' query={failed} what='this expense' signInHref='/guest/join' />
      </GuestShell>
    );
  }

  if (!expense) {
    return (
      <GuestShell group={group} back={back}>
        <StateMessage
          title='Expense not found'
          body='It may have been deleted.'
          actionLabel='Go back'
          onAction={() => router.back()}
        />
      </GuestShell>
    );
  }

  return (
    <GuestShell group={group} back={back}>
      <ExpenseDetail
        expense={expense}
        memberNames={group?.memberNames}
        memberMetadata={group?.memberMetadata}
        activities={trip?.activities || []}
        readOnly={true}
      />
    </GuestShell>
  );
};

export default GuestExpenseDetailContainer;
