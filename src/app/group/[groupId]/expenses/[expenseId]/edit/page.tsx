"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useExpenses } from "@/src/hooks/useExpenses";
import { useGroup } from "@/src/hooks/useGroups";
import { AppShell } from "@/src/app/components/shared/AppShell/AppShell";
import { FormPage } from "@/src/app/components/shared/AppShell/FormPage";
import { StateCard } from "@/src/app/components/shared/AppShell/StateCard";
import ExpenseForm from "@/src/app/components/shared/ExpenseForm";
import LoadingState from "@/src/app/components/shared/LoadingState";

export default function EditExpensePage({ params }: { params: Promise<{ groupId: string; expenseId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = searchParams.get("tripId");
  const { groupId, expenseId } = React.use(params);

  const { data: groupData, isLoading: loadingGroup } = useGroup(groupId);
  const { data: expensesData, isLoading: loadingExpenses } = useExpenses(tripId || "");

  const group = groupData?.group;
  const expense = expensesData?.expenses?.find((e) => e.id === expenseId);
  const trip = group?.trips?.find((t) => t.id === tripId);
  const back = {
    href: tripId ? `/group/${groupId}/expenses/${expenseId}?tripId=${tripId}` : `/group/${groupId}`,
    crumb: `${trip?.name ?? "Trip"} · Expense`,
  };

  if (loadingGroup || loadingExpenses) {
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
      <StateCard back={back} title='Trip missing' body='Open this page from an expense.' actionLabel='Go back' onAction={() => router.back()} />
    );
  }

  if (!expense) {
    return <StateCard back={back} title='Expense not found' actionLabel='Go back' onAction={() => router.back()} />;
  }

  return (
    <FormPage back={back} eyebrow={`${trip?.name ?? "Trip"} · ${group.name}`} title='Edit expense'>
      <ExpenseForm
        tripId={tripId}
        groupId={groupId}
        members={group.memberEmails || []}
        memberNames={group.memberNames}
        activities={trip?.activities || []}
        initialData={expense}
        onSuccess={() => router.push(`/group/${groupId}/trip/${tripId}?tab=expenses`)}
        onCancel={() => router.back()}
      />
    </FormPage>
  );
}
