"use client";

import React from "react";
import ExpenseDetail from "./index";
import { Expense, Trip } from "@/src/shared/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useGroup } from "@/src/hooks/useGroups";
import { useExpenses } from "@/src/hooks/useExpenses";
import api from "@/lib/axios";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { toast } from "sonner";
import { useSocketGroupUpdates } from "@/src/hooks/useSocketGroupUpdates";
import LoadingState from "../../shared/LoadingState";

interface IExpenseDetailContainer {
  groupId: string;
  expenseId: string;
}

const ExpenseDetailContainer = ({
  groupId,
  expenseId,
}: IExpenseDetailContainer) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const tripId = searchParams.get("tripId");

  const { data: groupData, isLoading: loadingGroup } = useGroup(groupId);
  // We need tripId to fetch expenses efficiently if we use useExpenses(tripId)
  // If tripId is not in URL, we might need to find it from the group data if possible,
  // or fetch all expenses for the group (if API supports that).
  // For now, let's assume tripId is passed or we can find the expense in the group structure if loaded.

  // However, useExpenses hook requires tripId.
  // If we don't have tripId, we might fail to load expenses if they are not in groupData.
  // But typically expenses are fetched per trip.

  const { data: expensesData, isLoading: loadingExpenses } = useExpenses(
    tripId || "",
  );

  useSocketGroupUpdates(groupId);

  const group = groupData?.group;

  // Find expense in loaded expenses or try to find in group structure if available
  const expense = expensesData?.expenses?.find((e) => e.id === expenseId);

  const trip = group?.trips?.find((t: Trip) => t.id === tripId);

  if (loadingGroup || (tripId && loadingExpenses)) {
    return (
      <main className='min-h-screen bg-slate-950 p-4'>
        <LoadingState fullScreen />
      </main>
    );
  }

  if (!expense) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-4'>
        <div className='text-center bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-8 max-w-md'>
          <h2 className='text-xl font-bold text-white mb-2'>
            Expense Not Found
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

  const handleEdit = () => {
    router.push(
      `/group/${groupId}/expenses/${expense.id}/edit?tripId=${tripId}`,
    );
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
      queryClient.invalidateQueries({ queryKey: ["expenses", tripId] });
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      toast.success("Expense deleted successfully");
      router.back();
    } catch (err) {
      toast.error("Failed to delete expense");
      console.error(err);
    }
  };

  const handleMarkPaid = async (memberId: string) => {
    if (!tripId) return;

    // Optimistic update
    const currentPaidMembers = expense.paidMembers || [];
    const newPaidMembers = [...currentPaidMembers, memberId];

    // Update local cache
    queryClient.setQueryData<{ expenses: Expense[] }>(
      ["expenses", tripId],
      (old) => {
        if (!old) return old;
        return {
          ...old,
          expenses: old.expenses.map((e) =>
            e.id === expenseId ? { ...e, paidMembers: newPaidMembers } : e,
          ),
        };
      },
    );

    try {
      await api.post(`/trips/${tripId}/expenses/${expenseId}/payments`, {
        memberEmail: memberId,
        isPaid: true,
      });
      // Invalidate to get fresh state
      queryClient.invalidateQueries({ queryKey: ["expenses", tripId] });
      toast.success("Marked as paid");
    } catch (err) {
      // Revert
      queryClient.invalidateQueries({ queryKey: ["expenses", tripId] });
      toast.error("Failed to update status");
      console.error(err);
    }
  };

  const handleConfirmPayment = async (
    memberEmail: string,
    status: "confirmed" | "rejected",
  ) => {
    if (!tripId) return;

    try {
      // This endpoint might need to be verified, assuming structure based on usage
      await api.post(`/trips/${tripId}/expenses/${expenseId}/confirm-payment`, {
        memberEmail,
        status,
      });
      queryClient.invalidateQueries({ queryKey: ["expenses", tripId] });
      toast.success(`Payment ${status}`);
    } catch (err) {
      toast.error("Failed to update payment status");
      console.error(err);
    }
  };

  return (
    <ExpenseDetail
      expense={expense}
      members={group?.memberEmails || []}
      memberNames={group?.memberNames}
      memberMetadata={group?.memberMetadata}
      activities={trip?.activities || []}
      onEdit={
        !expense.createdBy
          ? expense.paidBy === user?.email
            ? handleEdit
            : undefined
          : expense.createdBy.email === user?.email
            ? handleEdit
            : undefined
      }
      onDelete={
        !expense.createdBy
          ? expense.paidBy === user?.email
            ? handleDelete
            : undefined
          : expense.createdBy.email === user?.email
            ? handleDelete
            : undefined
      }
      onMarkPaid={handleMarkPaid}
      onConfirmPayment={handleConfirmPayment}
      currentUser={user?.email || ""}
    />
  );
};

export default ExpenseDetailContainer;
