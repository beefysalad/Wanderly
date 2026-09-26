import { redirect } from "next/navigation";

// The guest trip page has an Expenses tab; this route just opens it.
export default async function GuestExpensesPage({ params }: { params: Promise<{ groupId: string; tripId: string }> }) {
  const { groupId, tripId } = await params;
  redirect(`/guest/group/${groupId}/trip/${tripId}?tab=expenses`);
}
