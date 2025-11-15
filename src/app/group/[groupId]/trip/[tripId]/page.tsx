import TripComponent from "@/src/app/components/pages/Trip";
import React from "react";

const TripPage = async ({
  params,
}: {
  params: Promise<{ tripId: string; groupId: string }>;
}) => {
  const { tripId, groupId } = await params;
  return <TripComponent tripId={tripId} groupId={groupId} />;
};

export default TripPage;
