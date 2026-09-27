"use client";

import React from "react";
import ExpenseDetail from "./index";
import { Trip } from "@/src/shared/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useGroup } from "@/src/hooks/useGroups";
import { useConfirmPayment, useDeleteExpense, useExpenses, useMarkPaid } from "@/src/hooks/useExpenses";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { toast } from "sonner";
import { useSocketGroupUpdates } from "@/src/hooks/useSocketGroupUpdates";
import { AppShell } from "../../shared/AppShell/AppShell";
import { StateCard } from "../../shared/AppShell/StateCard";
import LoadingState from "../../shared/LoadingState";
import { blockingQuery } from "../../shared/StateMessage/loadError";

interface IExpenseDetailContainer {
  groupId: string;
  expenseId: string;
}

const ExpenseDetailContainer = ({ groupId, expenseId }: IExpenseDetailContainer) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useCurrentUser();
  const tripId = searchParams.get("tripId");

  const groupQuery = useGroup(groupId);
  const { data: groupData, isLoading: loadingGroup } = groupQuery;
  // We need tripId to fetch expenses efficiently if we use useExpenses(tripId)
  // If tripId is not in URL, we might need to find it from the group data if possible,
  // or fetch all expenses for the group (if API supports that).
  // For now, let's assume tripId is passed or we can find the expense in the group structure if loaded.

  // However, useExpenses hook requires tripId.
  // If we don't have tripId, we might fail to load expenses if they are not in groupData.
  // But typically expenses are fetched per trip.

  const expensesQuery = useExpenses(tripId);
  const { data: expensesData, isLoading: loadingExpenses } = expensesQuery;
  const deleteExpense = useDeleteExpense(tripId, expenseId, groupId);
  const markPaid = useMarkPaid(tripId, expenseId, groupId);
  const confirmPayment = useConfirmPayment(tripId, expenseId, groupId);

  useSocketGroupUpdates(groupId);

  const group = groupData?.group;

  // Find expense in loaded expenses or try to find in group structure if available
  const expense = expensesData?.expenses?.find((e) => e.id === expenseId);

  const trip = group?.trips?.find((t: Trip) => t.id === tripId);

  const back = {
    href: tripId ? `/group/${groupId}/trip/${tripId}?tab=expenses` : `/group/${groupId}`,
    crumb: `${trip?.name ?? group?.name ?? "Trip"} · Expense`,
  };

  if (loadingGroup || (tripId && loadingExpenses)) {
    return (
      <AppShell level='detail' back={back}>
        <LoadingState className='py-24' />
      </AppShell>
    );
  }

  const failed = blockingQuery(groupQuery, expensesQuery);
  if (failed) {
    return <StateCard back={back} variant='error' query={failed} what='this expense' />;
  }

  if (!expense) {
    return (
      <StateCard
        back={back}
        title='Expense not found'
        body='It may have been deleted.'
        actionLabel='Go back'
        onAction={() => router.back()}
      />
    );
  }

  const handleEdit = () => {
    router.push(`/group/${groupId}/expenses/${expense.id}/edit?tripId=${tripId}`);
  };

  const handleDelete = () => {
    deleteExpense.mutate(undefined, {
      onSuccess: () => {
        toast.success("Expense deleted successfully");
        router.back();
      },
      onError: () => toast.error("Failed to delete expense"),
    });
  };

  const handleMarkPaid = (memberEmail: string) => {
    if (!tripId) return;
    markPaid.mutate(memberEmail, {
      onSuccess: () => toast.success("Marked as paid"),
      onError: () => toast.error("Failed to update status"),
    });
  };

  const handleConfirmPayment = (memberEmail: string, status: "confirmed" | "rejected") => {
    if (!tripId) return;
    confirmPayment.mutate(
      { memberEmail, status },
      {
        onSuccess: () => toast.success(`Payment ${status}`),
        onError: () => toast.error("Failed to update payment status"),
      },
    );
  };

  // Mirrors the server rule: the creator, the payer or the group owner may change an expense.
  const userEmail = user?.email;
  const canChangeExpense =
    !!userEmail &&
    (expense.createdBy?.email === userEmail ||
      expense.paidBy === userEmail ||
      group?.createdByEmail === userEmail ||
      group?.createdBy === userEmail);

  return (
    <AppShell level='detail' back={back}>
      <ExpenseDetail
        expense={expense}
        members={group?.memberEmails || []}
        memberNames={group?.memberNames}
        memberMetadata={group?.memberMetadata}
        activities={trip?.activities || []}
        onEdit={canChangeExpense ? handleEdit : undefined}
        onDelete={canChangeExpense ? handleDelete : undefined}
        onMarkPaid={handleMarkPaid}
        onConfirmPayment={handleConfirmPayment}
        currentUser={user?.email || ""}
      />
    </AppShell>
  );
};

export default ExpenseDetailContainer;
