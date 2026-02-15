"use client";
import { usePathname } from "next/navigation";
import React from "react";
import { AuthGuard } from "./auth-guard";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const pathName = usePathname();
  const guestOnlyRoutes = ["/login", "/register"];
  const publicRoutes = ["/", "/about", "/faq", "/reviews", "/how-to"];

  const isGuestOnly = guestOnlyRoutes.includes(pathName);
  const isPublicRoute =
    publicRoutes.includes(pathName) ||
    pathName.startsWith("/guest") ||
    pathName.startsWith("/invite") ||
    pathName.startsWith("/admin");

  return (
    <AuthGuard
      requireAuth={!isPublicRoute && !isGuestOnly}
      guestOnly={isGuestOnly}
    >
      {children}
    </AuthGuard>
  );
};

export default AuthLayout;
