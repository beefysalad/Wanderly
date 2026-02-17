"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { MaintenanceMode } from "../pages/maintenance-mode";

interface MaintenanceProviderProps {
  children: ReactNode;
  isEnabled: boolean;
  estimate?: string;
}

export function MaintenanceProvider({
  children,
  isEnabled,
  estimate,
}: MaintenanceProviderProps) {
  const pathname = usePathname();

  // Always bypass maintenance mode for admin routes
  const isAdminRoute =
    pathname?.startsWith("/admin") || pathname?.startsWith("/api/admin");

  if (isEnabled && !isAdminRoute) {
    return <MaintenanceMode estimate={estimate} />;
  }

  return <>{children}</>;
}
