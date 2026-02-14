import React from "react";
import ActivityDetailContainer from "@/src/app/components/pages/ActivityDetail/ActivityDetailContainer";

const ActivityDetailPage = async ({
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
    <ActivityDetailContainer
      groupId={groupId}
      tripId={tripId}
      activityId={activityId}
    />
  );
};

export default ActivityDetailPage;
