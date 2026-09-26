"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useGroup } from "@/src/hooks/useGroups";
import { Trip } from "@/src/shared/types";
import BudgetForm from "@/src/app/components/pages/Budget/BudgetForm";
import { toast } from "sonner";
import { AppShell } from "@/src/app/components/shared/AppShell/AppShell";
import { FormPage } from "@/src/app/components/shared/AppShell/FormPage";
import LoadingState from "@/src/app/components/shared/LoadingState";

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
    router.push(`/group/${groupId}/trip/${tripId}?tab=budget`);
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <AppShell level='detail'>
        <LoadingState />
      </AppShell>
    );
  }

  if (!trip) return null;

  return (
    <FormPage back={{ href: `/group/${groupId}/trip/${tripId}?tab=budget`, crumb: trip.name }} title='New budget'>
      <BudgetForm
        tripId={tripId}
        groupId={groupId}
        activities={trip.activities || []}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </FormPage>
  );
};

export default AddBudgetPage;
