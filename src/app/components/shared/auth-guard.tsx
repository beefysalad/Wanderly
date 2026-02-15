"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import Spinner from "@/components/ui/spinner";
import { useCurrentUser } from "../../../hooks/useCurrentUser";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
  guestOnly?: boolean;
}

export function AuthGuard({
  children,
  redirectTo = "/",
  requireAuth = true,
  guestOnly = false,
}: AuthGuardProps) {
  const { user, loading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      router.replace(redirectTo);
    } else if (guestOnly && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router, redirectTo, requireAuth, guestOnly]);

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        {/* <Spinner label='Loading...' /> */}
      </div>
    );
  }

  // Show loading while redirecting
  if ((requireAuth && !user) || (guestOnly && user)) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Spinner label='Redirecting...' />
      </div>
    );
  }

  return <>{children}</>;
}
