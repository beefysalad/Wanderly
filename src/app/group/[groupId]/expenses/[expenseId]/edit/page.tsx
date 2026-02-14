"use client";

import { useGroup } from "@/src/hooks/useGroups";
import { useExpenses } from "@/src/hooks/useExpenses";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import ExpenseForm from "@/src/app/components/shared/ExpenseForm";
import React from "react";

export default function EditExpensePage({
  params,
}: {
  params: Promise<{ groupId: string; expenseId: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = searchParams.get("tripId");
  const { groupId, expenseId } = React.use(params);

  const { data: groupData, isLoading: loadingGroup } = useGroup(groupId);
  const { data: expensesData, isLoading: loadingExpenses } = useExpenses(
    tripId || "",
  );

  const group = groupData?.group;
  const expense = expensesData?.expenses?.find((e) => e.id === expenseId);

  if (loadingGroup || loadingExpenses) {
    return (
      <main className='min-h-screen flex items-center justify-center bg-slate-950'>
        <div className='text-center'>
          <Loader2 className='w-8 h-8 animate-spin mx-auto mb-2 text-orange-500' />
          <p className='text-slate-400'>Loading expense data...</p>
        </div>
      </main>
    );
  }

  if (!group) {
    return (
      <main className='min-h-screen flex items-center justify-center bg-slate-950'>
        <div className='text-center'>
          <p className='text-red-400 font-medium'>Group not found</p>
          <button
            onClick={() => router.push("/dashboard")}
            className='mt-4 text-orange-500 hover:underline'
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  if (!tripId) {
    return (
      <main className='min-h-screen flex items-center justify-center bg-slate-950'>
        <div className='text-center'>
          <p className='text-red-400 font-medium'>
            Trip ID missing. Please access this page from the expenses list.
          </p>
          <button
            onClick={() => router.back()}
            className='mt-4 text-orange-500 hover:underline'
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  if (!expense) {
    return (
      <main className='min-h-screen flex items-center justify-center bg-slate-950'>
        <div className='text-center'>
          <p className='text-red-400 font-medium'>Expense not found</p>
          <button
            onClick={() => router.back()}
            className='mt-4 text-orange-500 hover:underline'
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  const trip = group.trips?.find((t) => t.id === tripId);
  const members = group.memberEmails || [];

  return (
    <main className='min-h-screen bg-slate-950 flex flex-col relative overflow-hidden'>
      {/* Background Effects */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-3xl'></div>
        <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-3xl'></div>
      </div>

      {/* Top Bar */}
      <div className='p-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl flex items-center gap-4 sticky top-0 z-20'>
        <button
          onClick={() => router.back()}
          className='p-2 hover:bg-slate-800 rounded-full transition-colors'
        >
          <Loader2 className='w-5 h-5 text-slate-400 rotate-180' />
        </button>
        <div>
          <h1 className='text-lg font-bold text-white'>Edit Expense</h1>
          <p className='text-xs text-slate-400'>{trip?.name}</p>
        </div>
      </div>

      <div className='flex-1 flex flex-col max-w-3xl mx-auto w-full p-4 pb-24'>
        <ExpenseForm
          tripId={tripId}
          groupId={groupId}
          members={members}
          memberNames={group.memberNames}
          activities={trip?.activities || []}
          initialData={expense}
          hideHeader={true}
          onSuccess={() => {
            // Navigate back to expenses tab in trip view
            router.push(`/group/${groupId}/trip/${tripId}?tab=expenses`);
          }}
          onCancel={() => {
            router.back();
          }}
        />
      </div>
    </main>
  );
}
