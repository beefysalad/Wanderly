"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useGroup } from "@/src/hooks/useGroups";
import { useBudgets } from "@/src/hooks/useBudgets";
import { Trip } from "@/src/shared/types";
import BudgetForm from "@/src/app/components/pages/Budget/BudgetForm";
import { toast } from "sonner";
import DashboardLayoutHeader from "@/src/app/components/shared/DashboardLayoutHeader";
import { Target } from "lucide-react";
import PremiumBackground from "@/src/app/components/shared/PremiumBackground";

const EditBudgetPage = ({
  params,
}: {
  params: Promise<{ groupId: string; tripId: string; budgetId: string }>;
}) => {
  const router = useRouter();
  const { groupId, tripId, budgetId } = React.use(params);
  const { data: groupData, isLoading: loadingGroup } = useGroup(groupId);
  const { data: budgetsData, isLoading: loadingBudgets } = useBudgets(tripId);

  const group = groupData?.group || null;
  const trip = group?.trips?.find((t: Trip) => t.id === tripId) || null;
  const budget = budgetsData?.budgets?.find(
    (b: { id: string }) => b.id === budgetId,
  );

  const handleSuccess = () => {
    toast.success("Budget updated successfully");
    router.push(`/group/${groupId}/trip/${tripId}/budget`);
  };

  const handleCancel = () => {
    router.back();
  };

  if (loadingGroup || loadingBudgets) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-12 h-12 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-400 font-medium'>Loading...</p>
        </div>
      </main>
    );
  }

  if (!trip || !budget) return null;

  return (
    <main className='min-h-screen bg-slate-950 pb-6 relative overflow-hidden'>
      <PremiumBackground />
      <div className='max-w-xl mx-auto px-4 py-4 md:py-6 relative z-10'>
        <DashboardLayoutHeader
          showBack={true}
          onBack={handleCancel}
          title='Edit Budget'
          description={
            <span className='flex items-center gap-2'>
              <span className='p-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 inline-flex'>
                <Target className='w-3 h-3 text-orange-400' />
              </span>
              <span>{trip.name}</span>
            </span>
          }
        />
        <div className='mt-6'>
          <BudgetForm
            tripId={tripId}
            groupId={groupId}
            activities={trip.activities || []}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            initialData={budget}
          />
        </div>
      </div>
    </main>
  );
};

export default EditBudgetPage;
