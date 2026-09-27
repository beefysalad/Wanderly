"use client";

import React from "react";
import ActivityDetail from "../ActivityDetail";
import { Activity, Trip } from "@/src/shared/types";
import { useRouter } from "next/navigation";
import { useGroupAsGuest } from "@/src/hooks/useGroups";
import { useExpenses } from "@/src/hooks/useExpenses";
import { GuestShell } from "../../shared/AppShell/GuestShell";
import LoadingState from "../../shared/LoadingState";
import { StateMessage } from "../../shared/StateMessage";
import { blockingQuery } from "../../shared/StateMessage/loadError";

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
  const groupQuery = useGroupAsGuest(groupId);
  const { data: groupData, isLoading: loadingGroup } = groupQuery;
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

  const failed = blockingQuery(groupQuery);
  if (failed) {
    return (
      <GuestShell group={group} back={back}>
        <StateMessage variant='error' query={failed} what='this activity' signInHref='/guest/join' />
      </GuestShell>
    );
  }

  if (!activity) {
    return (
      <GuestShell group={group} back={back}>
        <StateMessage
          title='Activity not found'
          body='It may have been deleted.'
          actionLabel='Go back'
          onAction={() => router.back()}
        />
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
