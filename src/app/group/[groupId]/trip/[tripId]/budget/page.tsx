import BudgetComponent from "@/src/app/components/pages/Budget";
import React from "react";

const BudgetPage = async ({
  params,
}: {
  params: Promise<{ groupId: string; tripId: string }>;
}) => {
  const { groupId, tripId } = await params;
  return <BudgetComponent groupId={groupId} tripId={tripId} />;
};

export default BudgetPage;
