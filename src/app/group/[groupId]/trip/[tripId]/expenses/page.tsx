import { redirect } from "next/navigation";

// Expenses now live in the trip's Expenses tab; this keeps old links working.
const ExpensesPage = async ({ params }: { params: Promise<{ groupId: string; tripId: string }> }) => {
  const { groupId, tripId } = await params;
  redirect(`/group/${groupId}/trip/${tripId}?tab=expenses`);
};

export default ExpensesPage;
