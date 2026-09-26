"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGroup } from "@/src/hooks/useGroups";
import { AppShell } from "@/src/app/components/shared/AppShell/AppShell";
import { FormPage } from "@/src/app/components/shared/AppShell/FormPage";
import { StateCard } from "@/src/app/components/shared/AppShell/StateCard";
import ExpenseForm from "@/src/app/components/shared/ExpenseForm/index";
import LoadingState from "@/src/app/components/shared/LoadingState";

export default function AddExpensePage({ params }: { params: Promise<{ groupId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = searchParams.get("tripId");
  const { groupId } = React.use(params);

  const { data: groupData, isLoading } = useGroup(groupId);
  const group = groupData?.group;
  const trip = group?.trips?.find((t) => t.id === tripId);
  const back = { href: tripId ? `/group/${groupId}/trip/${tripId}?tab=expenses` : `/group/${groupId}`, crumb: `${trip?.name ?? "Trip"} · Expenses` };

  if (isLoading) {
    return (
      <AppShell level='detail' back={back}>
        <LoadingState className='py-24' />
      </AppShell>
    );
  }

  if (!group) {
    return <StateCard back={back} title='Group not found' actionLabel='Back to dashboard' onAction={() => router.push("/dashboard")} />;
  }

  if (!tripId) {
    return (
      <StateCard
        back={back}
        title='Trip missing'
        body='Open this page from a trip’s expenses list.'
        actionLabel='Go back'
        onAction={() => router.back()}
      />
    );
  }

  return (
    <FormPage back={back} eyebrow={`${trip?.name ?? "Trip"} · ${group.name}`} title='New expense'>
      <ExpenseForm
        tripId={tripId}
        groupId={groupId}
        members={group.memberEmails || []}
        memberNames={group.memberNames}
        activities={trip?.activities || []}
        onSuccess={() => router.push(`/group/${groupId}/trip/${tripId}?tab=expenses`)}
        onCancel={() => router.back()}
      />
    </FormPage>
  );
}
