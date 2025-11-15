"use client";
import { usePathname } from "next/navigation";
import React from "react";
import { AuthGuard } from "./auth-guard";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const pathName = usePathname();
  const publicRoutes = ["/", "/about", "/faq"];
  const isPublicRoute = publicRoutes.includes(pathName);
  return <AuthGuard requireAuth={!isPublicRoute}>{children}</AuthGuard>;
};

export default AuthLayout;
