"use client";

import { useGroup } from "@/src/hooks/useGroups";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import ExpenseForm from "@/src/app/components/shared/ExpenseForm";
import { ArrowLeft } from "lucide-react";
import React from "react";

export default function AddExpensePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = searchParams.get("tripId");
  const { groupId } = React.use(params);

  const { data: groupData, isLoading } = useGroup(groupId);
  const group = groupData?.group;

  if (isLoading) {
    return (
      <main className='min-h-screen flex items-center justify-center bg-slate-950'>
        <div className='text-center'>
          <Loader2 className='w-8 h-8 animate-spin mx-auto mb-2 text-orange-500' />
          <p className='text-slate-400'>Loading group data...</p>
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

  // If tripId is missing, we could try to find the active trip or show error
  // For now, let's assume tripId is passed or we show error.
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

  const trip = group.trips?.find((t) => t.id === tripId);
  const members = group.memberEmails || [];

  return (
    <main className='min-h-screen bg-slate-950 flex flex-col relative overflow-hidden'>
      {/* Background Effects */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-3xl'></div>
        <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-3xl'></div>
      </div>

      {/* Header */}
      <div className='p-4 md:p-6 z-20 relative'>
        <button
          onClick={() => router.back()}
          className='flex items-center gap-2 px-3 py-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all'
        >
          <ArrowLeft className='w-5 h-5' />
        </button>
      </div>

      <div className='flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 pb-24 relative z-10'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-white mb-2'>Add Expense</h1>
          <p className='text-slate-400'>Add to {trip?.name}</p>
        </div>
        <ExpenseForm
          tripId={tripId}
          groupId={groupId}
          members={members}
          memberNames={group.memberNames}
          activities={trip?.activities || []}
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
