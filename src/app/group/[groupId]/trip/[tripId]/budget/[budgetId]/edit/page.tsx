"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useGroup } from "@/src/hooks/useGroups";
import { useBudgets } from "@/src/hooks/useBudgets";
import { Trip } from "@/src/shared/types";
import BudgetForm from "@/src/app/components/pages/Budget/BudgetForm";
import { toast } from "sonner";
import { AppShell } from "@/src/app/components/shared/AppShell/AppShell";
import { FormPage } from "@/src/app/components/shared/AppShell/FormPage";
import LoadingState from "@/src/app/components/shared/LoadingState";

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
    router.push(`/group/${groupId}/trip/${tripId}?tab=budget`);
  };

  const handleCancel = () => {
    router.back();
  };

  if (loadingGroup || loadingBudgets) {
    return (
      <AppShell level='detail'>
        <LoadingState />
      </AppShell>
    );
  }

  if (!trip || !budget) return null;

  return (
    <FormPage back={{ href: `/group/${groupId}/trip/${tripId}?tab=budget`, crumb: trip.name }} title='Edit budget'>
      <BudgetForm
        tripId={tripId}
        groupId={groupId}
        activities={trip.activities || []}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        initialData={budget}
      />
    </FormPage>
  );
};

export default EditBudgetPage;
