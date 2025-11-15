"use client";

import { use } from "react";
import GuestGroupComponent from "@/src/app/components/pages/GuestGroup";

export default function GuestGroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  return <GuestGroupComponent groupId={groupId} />;
}

