"use client";

import React, { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGroup } from "@/src/hooks/useGroups";
import { AppShell } from "@/src/app/components/shared/AppShell/AppShell";
import { FormPage } from "@/src/app/components/shared/AppShell/FormPage";
import { StateCard } from "@/src/app/components/shared/AppShell/StateCard";
import LoadingState from "@/src/app/components/shared/LoadingState";
import ActivityForm from "@/src/app/components/pages/ActivityForm";
import { getActivityFormLoadState } from "@/src/app/components/pages/ActivityForm/activityFormLoadState";
import type { Trip } from "@/src/shared/types";

interface AddActivityPageProps {
  params: Promise<{ groupId: string; tripId: string }>;
}

const parseDateParam = (value: string | null): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const AddActivityPage = ({ params }: AddActivityPageProps) => {
  const { groupId, tripId } = React.use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const preSelectedDate = useMemo(() => parseDateParam(dateParam), [dateParam]);

  const groupQuery = useGroup(groupId);
  const trip = groupQuery.data?.group?.trips?.find((t: Trip) => t.id === tripId) || null;
  const back = { href: `/group/${groupId}`, crumb: "Group" };

  const loadState = getActivityFormLoadState({ isLoading: groupQuery.isLoading, groupQuery, trip, requireActivity: false });

  if (loadState.status === "loading") {
    return (
      <AppShell level='detail'>
        <LoadingState />
      </AppShell>
    );
  }

  if (loadState.status === "error") {
    return <StateCard back={back} variant='error' query={loadState.query} what='this trip' />;
  }

  if (loadState.status === "not-found") {
    return <StateCard back={back} title={loadState.what} actionLabel='Go back' onAction={() => router.back()} />;
  }

  return (
    <FormPage back={{ href: `/group/${groupId}/trip/${tripId}`, crumb: loadState.trip.name }} title='New activity' width='sm'>
      <ActivityForm
        mode='add'
        trip={loadState.trip}
        tripId={tripId}
        groupId={groupId}
        preSelectedDate={preSelectedDate}
        onSuccess={() => router.push(`/group/${groupId}/trip/${tripId}`)}
      />
    </FormPage>
  );
};

export default AddActivityPage;
