"use client";

import { useGroup } from "@/src/hooks/useGroups";
import { useRouter, useSearchParams } from "next/navigation";
import ExpenseForm from "@/src/app/components/shared/ExpenseForm/index";
import React from "react";
import PremiumBackground from "@/src/app/components/shared/PremiumBackground";
import PremiumPageHeader from "@/src/app/components/shared/PremiumPageHeader";
import LoadingState from "@/src/app/components/shared/LoadingState";

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
      <main className='min-h-screen bg-slate-950 p-4'>
        <LoadingState fullScreen />
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
    <main className='h-screen bg-slate-950 flex flex-col relative overflow-hidden'>
      <PremiumBackground />

      <div className='flex-shrink-0 z-20'>
        <div className='max-w-xl mx-auto px-4 py-4 md:py-6'>
          <PremiumPageHeader onBack={() => router.back()} title='NEW EXPENSE' />
        </div>
      </div>

      <div className='flex-1 w-full max-w-xl mx-auto px-4 pb-4 relative z-10 overflow-hidden flex flex-col'>
        <ExpenseForm
          tripId={tripId}
          groupId={groupId}
          members={members}
          memberNames={group.memberNames}
          activities={trip?.activities || []}
          hideHeader={true}
          cleanMode={true}
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
