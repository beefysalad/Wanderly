import { redirect } from "next/navigation";

// The budget now lives in the trip's Budget tab; this keeps old links working.
const BudgetPage = async ({ params }: { params: Promise<{ groupId: string; tripId: string }> }) => {
  const { groupId, tripId } = await params;
  redirect(`/group/${groupId}/trip/${tripId}?tab=budget`);
};

export default BudgetPage;
