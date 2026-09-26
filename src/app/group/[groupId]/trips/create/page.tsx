"use client";

import CreateTrip from "@/src/app/components/pages/CreateTrip";

export default function CreateTripPage({ params }: { params: { groupId: string } }) {
  return <CreateTrip groupId={params.groupId} />;
}
