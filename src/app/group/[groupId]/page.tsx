import React from "react";
import GroupComponent from "../../components/pages/Group";

const GroupPage = ({ params }: { params: { groupId: string } }) => {
  return <GroupComponent param={params.groupId} />;
};

export default GroupPage;
