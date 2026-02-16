import React from "react";
import GuestExpenseDetailContainer from "@/src/app/components/pages/GuestExpenseDetail";

const GuestExpenseDetailPage = async ({
  params,
}: {
  params: Promise<{
    groupId: string;
    expenseId: string;
  }>;
}) => {
  const { groupId, expenseId } = await params;
  return (
    <GuestExpenseDetailContainer groupId={groupId} expenseId={expenseId} />
  );
};

export default GuestExpenseDetailPage;
