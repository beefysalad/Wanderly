"use client";

import React from "react";
import ActivityDetail from "../ActivityDetail";
import { Activity, Trip } from "@/src/shared/types";
import { useRouter } from "next/navigation";
import { useGroupAsGuest } from "@/src/hooks/useGroups";
import { useExpenses } from "@/src/hooks/useExpenses";
import LoadingState from "../../shared/LoadingState";

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

  if (loadingGroup) {
    return (
      <main className='min-h-screen bg-slate-950 p-6'>
        <LoadingState fullScreen />
      </main>
    );
  }

  if (!activity) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-4'>
        <div className='text-center bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-8 max-w-md'>
          <h2 className='text-xl font-bold text-white mb-2'>
            Activity Not Found
          </h2>
          <button
            onClick={() => router.back()}
            className='px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold'
          >
            Go Back
          </button>
        </div>
      </main>
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
    <ActivityDetail
      activity={activity}
      expenses={expenses}
      onSelectExpense={handleSelectExpense}
      readOnly={true}
    />
  );
};

export default GuestActivityDetailContainer;
