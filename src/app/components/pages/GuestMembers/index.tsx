"use client";

import MembersComponent from "../Members";

const GuestMembersComponent = ({ groupId }: { groupId: string }) => <MembersComponent groupId={groupId} guest />;

export default GuestMembersComponent;
