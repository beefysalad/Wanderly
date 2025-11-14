"use client";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import React from "react";

const DashboardPage = () => {
  const { user } = useCurrentUser();
  return <div>DashboardPage {user?.displayName}</div>;
};

export default DashboardPage;
