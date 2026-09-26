"use client";

import React from "react";
import ActivityDetail from "../ActivityDetail";
import { Activity, Trip } from "@/src/shared/types";
import { useRouter } from "next/navigation";
import { useGroupAsGuest } from "@/src/hooks/useGroups";
import { useExpenses } from "@/src/hooks/useExpenses";
import { GuestShell } from "../../shared/AppShell/GuestShell";
import LoadingState from "../../shared/LoadingState";
import { PILL } from "../../shared/Pills";

interface IGuestActivityDetailContainer {
  groupId: string;
  tripId: string;
  activityId: string;
}

const GuestActivityDetailContainer = ({
  groupId,
  tripId,
  activityId,
}: IGuestActivityDetailContainer) => {
  const router = useRouter();
  const { data: groupData, isLoading: loadingGroup } = useGroupAsGuest(groupId);
  const { data: expensesData } = useExpenses(tripId);

  const group = groupData;
  const trip = group?.trips?.find((t: Trip) => t.id === tripId);
  const activity = trip?.activities?.find((a: Activity) => a.id === activityId);
  const expenses = expensesData?.expenses || [];

  const back = {
    href: `/guest/group/${groupId}/trip/${tripId}`,
    crumb: `${trip?.name ?? group?.name ?? "Trip"} · Activity`,
  };

  if (loadingGroup) {
    return (
      <GuestShell group={group} back={back}>
        <LoadingState className='py-24' />
      </GuestShell>
    );
  }

  if (!activity) {
    return (
      <GuestShell group={group} back={back}>
        <div className='mx-auto max-w-md rounded-[22px] border border-white/[.08] bg-[rgba(15,23,42,.6)] p-10 text-center'>
          <h2 className='mb-2 text-xl font-bold'>Activity not found</h2>
          <p className='mb-6 text-[#94a3b8]'>It may have been deleted.</p>
          <button type='button' onClick={() => router.back()} className={PILL.ghost}>
            Go back
          </button>
        </div>
      </GuestShell>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectExpense = (expense: any) => {
    // Navigate to guest expense detail
    // Note: ensure this route matches where you mount the guest expense page
    router.push(
      `/guest/group/${groupId}/expenses/${expense.id}?tripId=${tripId}`,
    );
  };

  return (
    <GuestShell group={group} back={back}>
      <ActivityDetail
        activity={activity}
        expenses={expenses}
        onSelectExpense={handleSelectExpense}
        readOnly={true}
      />
    </GuestShell>
  );
};

export default GuestActivityDetailContainer;
