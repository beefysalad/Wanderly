"use client";

import { use } from "react";
import GuestExpensesComponent from "@/src/app/components/pages/GuestExpenses";

export default function GuestExpensesPage({
  params,
}: {
  params: Promise<{ groupId: string; tripId: string }>;
}) {
  const { groupId, tripId } = use(params);
  return <GuestExpensesComponent groupId={groupId} tripId={tripId} />;
}

