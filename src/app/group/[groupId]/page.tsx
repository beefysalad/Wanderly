import React from "react";
import GroupComponent from "../../components/pages/Group";

const GroupPage = async ({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) => {
  const { groupId } = await params;

  return <GroupComponent param={groupId} />;
};

export default GroupPage;
