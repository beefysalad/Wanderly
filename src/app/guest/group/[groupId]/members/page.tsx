"use client";

import { use } from "react";
import GuestMembersComponent from "@/src/app/components/pages/GuestMembers";

export default function GuestMembersPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  return <GuestMembersComponent groupId={groupId} />;
}

