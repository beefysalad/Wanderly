"use client";
import { usePathname } from "next/navigation";
import React from "react";
import { AuthGuard } from "./auth-guard";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const pathName = usePathname();
  const publicRoutes = ["/", "/about", "/faq", "/reviews"];
  const isPublicRoute =
    publicRoutes.includes(pathName) ||
    pathName.startsWith("/guest") ||
    pathName.startsWith("/invite");
  return <AuthGuard requireAuth={!isPublicRoute}>{children}</AuthGuard>;
};

export default AuthLayout;
