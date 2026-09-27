"use client";
import { usePathname } from "next/navigation";
import React from "react";
import { AuthGuard } from "./auth-guard";
import { routeAccess } from "./routeAccess";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const access = routeAccess(usePathname());

  // Public pages skip the guard entirely so their server HTML is the page, not a spinner.
  if (access === "public") return <>{children}</>;

  return <AuthGuard access={access}>{children}</AuthGuard>;
};

export default AuthLayout;
