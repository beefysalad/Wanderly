import React from "react";
import GuestActivityDetailContainer from "@/src/app/components/pages/GuestActivityDetail";

const GuestActivityDetailPage = async ({
  params,
}: {
  params: Promise<{
    groupId: string;
    tripId: string;
    activityId: string;
  }>;
}) => {
  const { groupId, tripId, activityId } = await params;
  return (
    <GuestActivityDetailContainer
      groupId={groupId}
      tripId={tripId}
      activityId={activityId}
    />
  );
};

export default GuestActivityDetailPage;
