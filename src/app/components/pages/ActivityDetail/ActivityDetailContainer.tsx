"use client";

import React, { useState } from "react";
import ActivityDetail from "./index";
import { Activity, Group, Expense, Trip } from "@/src/shared/types";
import { useRouter } from "next/navigation";
import { useGroup } from "@/src/hooks/useGroups";
import { useExpenses } from "@/src/hooks/useExpenses";
import api from "@/lib/axios";
import { useQueryClient } from "@tanstack/react-query";
import ConfirmDeleteModal from "../../shared/Modal/ConfirmDeleteModal";
import { AppShell } from "../../shared/AppShell/AppShell";
import { StateCard } from "../../shared/AppShell/StateCard";
import LoadingState from "../../shared/LoadingState";

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
  const { data: groupData, isLoading: loadingGroup } = useGroup(groupId);
  const { data: expensesData } = useExpenses(tripId);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/trips/${tripId}/activities/${activityId}`);
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      router.push(`/group/${groupId}/trip/${tripId}?tab=daily`);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete activity. Please try again.",
      );
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleToggleDone = async () => {
    const newDoneState = !activity.done;
    const previousState = activity.done;

    // Optimistic update
    queryClient.setQueryData<{ group: Group }>(["groups", groupId], (old) => {
      if (!old) return old;
      return {
        group: {
          ...old.group,
          trips: old.group.trips?.map((t) => {
            if (t.id !== tripId) return t;
            return {
              ...t,
              activities: t.activities?.map((a) =>
                a.id === activityId ? { ...a, done: newDoneState } : a,
              ),
            };
          }),
        },
      };
    });

    try {
      await api.patch(`/trips/${tripId}/activities/${activityId}`, {
        done: newDoneState,
      });
      queryClient.refetchQueries({
        queryKey: ["groups", groupId],
        type: "active",
      });
    } catch (err) {
      // Revert
      queryClient.setQueryData<{ group: Group }>(["groups", groupId], (old) => {
        if (!old) return old;
        return {
          group: {
            ...old.group,
            trips: old.group.trips?.map((t) => {
              if (t.id !== tripId) return t;
              return {
                ...t,
                activities: t.activities?.map((a) =>
                  a.id === activityId ? { ...a, done: previousState } : a,
                ),
              };
            }),
          },
        };
      });
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
          isDeleting={isDeleting}
          confirmText='Delete Activity'
        />
      )}
    </AppShell>
  );
};

export default ActivityDetailContainer;
