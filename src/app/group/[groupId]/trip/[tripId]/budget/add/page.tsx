"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useGroup } from "@/src/hooks/useGroups";
import { Trip } from "@/src/shared/types";
import BudgetForm from "@/src/app/components/pages/Budget/BudgetForm";
import { toast } from "sonner";
import PremiumPageHeader from "@/src/app/components/shared/PremiumPageHeader";
import PremiumBackground from "@/src/app/components/shared/PremiumBackground";

const AddBudgetPage = ({
  params,
}: {
  params: Promise<{ groupId: string; tripId: string }>;
}) => {
  const router = useRouter();
  const { groupId, tripId } = React.use(params);
  const { data: groupData, isLoading } = useGroup(groupId);

  const group = groupData?.group || null;
  const trip = group?.trips?.find((t: Trip) => t.id === tripId) || null;

  const handleSuccess = () => {
    toast.success("Budget added successfully");
    router.push(`/group/${groupId}/trip/${tripId}/budget`);
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-12 h-12 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-400 font-medium'>Loading...</p>
        </div>
      </main>
    );
  }

  if (!trip) return null;

  return (
    <main className='min-h-screen bg-slate-950 pb-6 relative overflow-hidden'>
      <PremiumBackground />
      <div className='max-w-xl mx-auto px-4 py-4 md:py-6 relative z-10'>
        <PremiumPageHeader onBack={handleCancel} title='NEW BUDGET' />
        <div className='mt-6'>
          <BudgetForm
            tripId={tripId}
            groupId={groupId}
            activities={trip.activities || []}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </main>
  );
};

export default AddBudgetPage;
