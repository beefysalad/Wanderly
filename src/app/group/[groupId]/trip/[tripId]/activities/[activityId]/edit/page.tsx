"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useGroup } from "@/src/hooks/useGroups";
import { AppShell } from "@/src/app/components/shared/AppShell/AppShell";
import { FormPage } from "@/src/app/components/shared/AppShell/FormPage";
import { StateCard } from "@/src/app/components/shared/AppShell/StateCard";
import LoadingState from "@/src/app/components/shared/LoadingState";
import ActivityForm from "@/src/app/components/pages/ActivityForm";
import { getActivityFormLoadState } from "@/src/app/components/pages/ActivityForm/activityFormLoadState";
import type { Activity, Trip } from "@/src/shared/types";

interface EditActivityPageProps {
  params: Promise<{ groupId: string; tripId: string; activityId: string }>;
}

const EditActivityPage = ({ params }: EditActivityPageProps) => {
  const { groupId, tripId, activityId } = React.use(params);
  const router = useRouter();

  const groupQuery = useGroup(groupId);
  const trip = groupQuery.data?.group?.trips?.find((t: Trip) => t.id === tripId) || null;
  const activity = trip?.activities?.find((a: Activity) => a.id === activityId);
  const back = { href: `/group/${groupId}`, crumb: "Group" };

  const loadState = getActivityFormLoadState({ isLoading: groupQuery.isLoading, groupQuery, trip, activity, requireActivity: true });

  if (loadState.status === "loading") {
    return (
      <AppShell level='detail'>
        <LoadingState />
      </AppShell>
    );
  }

  if (loadState.status === "error") {
    return <StateCard back={back} variant='error' query={loadState.query} what='this activity' />;
  }

  if (loadState.status === "not-found") {
    return <StateCard back={back} title={loadState.what} actionLabel='Go back' onAction={() => router.back()} />;
  }

  return (
    <FormPage back={{ href: `/group/${groupId}/trip/${tripId}`, crumb: trip!.name }} title='Edit activity' width='lg'>
      <ActivityForm
        mode='edit'
        trip={trip!}
        activity={activity!}
        tripId={tripId}
        groupId={groupId}
        onSuccess={() => router.push(`/group/${groupId}/trip/${tripId}`)}
      />
    </FormPage>
  );
};

export default EditActivityPage;
