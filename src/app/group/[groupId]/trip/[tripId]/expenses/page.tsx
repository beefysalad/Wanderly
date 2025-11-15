import ExpensesComponent from "@/src/app/components/pages/Expenses";
import React from "react";

const ExpensesPage = async ({
  params,
}: {
  params: Promise<{ groupId: string; tripId: string }>;
}) => {
  const { groupId, tripId } = await params;
  return <ExpensesComponent groupId={groupId} tripId={tripId} />;
};

export default ExpensesPage;
