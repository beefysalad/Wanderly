"use client";

import { use } from "react";
import GuestTripComponent from "@/src/app/components/pages/GuestTrip";

export default function GuestTripPage({
  params,
}: {
  params: Promise<{ groupId: string; tripId: string }>;
}) {
  const { groupId, tripId } = use(params);
  return <GuestTripComponent groupId={groupId} tripId={tripId} />;
}

