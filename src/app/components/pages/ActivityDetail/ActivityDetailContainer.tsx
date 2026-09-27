"use client";

import React, { useState } from "react";
import ActivityDetail from "./index";
import { Activity, Expense, Trip } from "@/src/shared/types";
import { useRouter } from "next/navigation";
import { useGroup } from "@/src/hooks/useGroups";
import { useExpenses } from "@/src/hooks/useExpenses";
import { useDeleteActivity, useUpdateActivity } from "@/src/hooks/useActivities";
import { useQueryClient } from "@tanstack/react-query";
import ConfirmDeleteModal from "../../shared/Modal/ConfirmDeleteModal";
import { AppShell } from "../../shared/AppShell/AppShell";
import { StateCard } from "../../shared/AppShell/StateCard";
import LoadingState from "../../shared/LoadingState";
import { blockingQuery } from "../../shared/StateMessage/loadError";
import { patchActivityInCache } from "../Trip/tripCache";

interface IActivityDetailContainer {
  groupId: string;
  tripId: string;
  activityId: string;
}

const ActivityDetailContainer = ({
  groupId,
  tripId,
  activityId,
}: IActivityDetailContainer) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const groupQuery = useGroup(groupId);
  const { data: groupData, isLoading: loadingGroup } = groupQuery;
  const { data: expensesData } = useExpenses(tripId);
  const deleteActivity = useDeleteActivity(tripId, groupId);
  const updateActivity = useUpdateActivity(tripId, groupId);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const group = groupData?.group;
  const trip = group?.trips?.find((t: Trip) => t.id === tripId);
  const activity = trip?.activities?.find((a: Activity) => a.id === activityId);
  const expenses = expensesData?.expenses || [];

  const back = {
    href: `/group/${groupId}/trip/${tripId}`,
    crumb: `${trip?.name ?? group?.name ?? "Trip"} · Activity`,
  };

  if (loadingGroup) {
    return (
      <AppShell level='detail' back={back}>
        <LoadingState className='py-24' />
      </AppShell>
    );
  }

  const failed = blockingQuery(groupQuery);
  if (failed) {
    return <StateCard back={back} variant='error' query={failed} what='this activity' />;
  }

  if (!activity) {
    return (
      <StateCard
        back={back}
        title='Activity not found'
        body='It may have been deleted.'
        actionLabel='Go back'
        onAction={() => router.back()}
      />
    );
  }

  const handleEdit = () => {
    router.push(
      `/group/${groupId}/trip/${tripId}/activities/${activityId}/edit`,
    );
  };

  const handleDelete = () => {
    deleteActivity.mutate(activityId, {
      onSuccess: () => router.push(`/group/${groupId}/trip/${tripId}?tab=daily`),
      onError: (err) => {
        alert(err.message || "Failed to delete activity. Please try again.");
        setShowDeleteModal(false);
      },
    });
  };

  const handleToggleDone = async () => {
    const previousState = activity.done;
    const setDone = (done: boolean) =>
      patchActivityInCache(queryClient, groupId, tripId, activityId, (a) => ({ ...a, done }));

    setDone(!previousState);
    try {
      await updateActivity.mutateAsync({ activityId, updates: { done: !previousState } });
    } catch (err) {
      setDone(previousState);
      console.error(err);
    }
  };

  const handleSelectExpense = (expense: Expense) => {
    router.push(`/group/${groupId}/expenses/${expense.id}?tripId=${tripId}`);
  };

  return (
    <AppShell level='detail' back={back}>
      <ActivityDetail
        activity={activity}
        expenses={expenses}
        onEdit={handleEdit}
        onDelete={() => setShowDeleteModal(true)}
        onToggleDone={handleToggleDone}
        onSelectExpense={handleSelectExpense}
      />

      {showDeleteModal && (
        <ConfirmDeleteModal
          title='Delete Activity'
          message='Are you sure you want to delete this activity? This action cannot be undone.'
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          isDeleting={deleteActivity.isPending}
          confirmText='Delete Activity'
        />
      )}
    </AppShell>
  );
};

export default ActivityDetailContainer;
