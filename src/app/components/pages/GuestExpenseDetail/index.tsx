"use client";

import React from "react";
import ExpenseDetail from "../ExpenseDetail";
import { Trip } from "@/src/shared/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useGroupAsGuest } from "@/src/hooks/useGroups";
import { useExpenses } from "@/src/hooks/useExpenses";
import { GuestShell } from "../../shared/AppShell/GuestShell";
import LoadingState from "../../shared/LoadingState";
import { PILL } from "../../shared/Pills";

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

  const { data: groupData, isLoading: loadingGroup } = useGroupAsGuest(groupId);

  const { data: expensesData, isLoading: loadingExpenses } = useExpenses(
    tripId || "",
  );

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

  if (!expense) {
    return (
      <GuestShell group={group} back={back}>
        <div className='mx-auto max-w-md rounded-[22px] border border-white/[.08] bg-[rgba(15,23,42,.6)] p-10 text-center'>
          <h2 className='mb-2 text-xl font-bold'>Expense not found</h2>
          <p className='mb-6 text-[#94a3b8]'>It may have been deleted.</p>
          <button type='button' onClick={() => router.back()} className={PILL.ghost}>
            Go back
          </button>
        </div>
      </GuestShell>
    );
  }

  return (
    <GuestShell group={group} back={back}>
      <ExpenseDetail
        expense={expense}
        members={group?.memberEmails || []}
        memberNames={group?.memberNames}
        memberMetadata={group?.memberMetadata}
        activities={trip?.activities || []}
        readOnly={true}
      />
    </GuestShell>
  );
};

export default GuestExpenseDetailContainer;
