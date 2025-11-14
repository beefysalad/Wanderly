"use client";
import { auth } from "@/lib/firebase";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { signOut } from "firebase/auth";
import React from "react";
import DashboardComponent from "../components/pages/Dashboard";

const DashboardPage = () => {
  const { user } = useCurrentUser();
  const handleLogout = async () => {
    await signOut(auth);
  };
  return <DashboardComponent />;
};

export default DashboardPage;
