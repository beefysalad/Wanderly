import React from "react";
import ExpenseDetailContainer from "@/src/app/components/pages/ExpenseDetail/ExpenseDetailContainer";

const ExpenseDetailPage = async ({
  params,
}: {
  params: Promise<{
    groupId: string;
    expenseId: string;
  }>;
}) => {
  const { groupId, expenseId } = await params;
  return <ExpenseDetailContainer groupId={groupId} expenseId={expenseId} />;
};

export default ExpenseDetailPage;
