"use client";

import React from "react";
import ExpenseDetail from "../ExpenseDetail";
import { Trip } from "@/src/shared/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useGroupAsGuest } from "@/src/hooks/useGroups";
import { useExpenses } from "@/src/hooks/useExpenses";

interface IGuestExpenseDetailContainer {
  groupId: string;
  expenseId: string;
}

const GuestExpenseDetailContainer = ({
  groupId,
  expenseId,
}: IGuestExpenseDetailContainer) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = searchParams.get("tripId");

  const { data: groupData, isLoading: loadingGroup } = useGroupAsGuest(groupId);

  const { data: expensesData, isLoading: loadingExpenses } = useExpenses(
    tripId || "",
  );

  const group = groupData;
  const trip = group?.trips?.find((t: Trip) => t.id === tripId);
  const expense = expensesData?.expenses?.find((e) => e.id === expenseId);

  if (loadingGroup || (tripId && loadingExpenses)) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-400 font-medium'>Loading expense...</p>
        </div>
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

  return (
    <ExpenseDetail
      expense={expense}
      members={group?.memberEmails || []}
      memberNames={group?.memberNames}
      memberMetadata={group?.memberMetadata}
      activities={trip?.activities || []}
      readOnly={true}
    />
  );
};

export default GuestExpenseDetailContainer;
