import MembersComponent from "@/src/app/components/pages/Members";
import React from "react";

const MembersPage = async ({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) => {
  const { groupId } = await params;
  return <MembersComponent groupId={groupId} />;
};

export default MembersPage;
