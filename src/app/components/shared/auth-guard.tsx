"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import LoadingState from "../shared/LoadingState";
import { useCurrentUser } from "../../../hooks/useCurrentUser";
import { guardOutcome, type RouteAccess } from "./routeAccess";

interface AuthGuardProps {
  children: React.ReactNode;
  access: Exclude<RouteAccess, "public">;
}

/** Holds a protected or guest-only page behind a spinner until Firebase reports, then renders or redirects. */
export function AuthGuard({ children, access }: AuthGuardProps) {
  const { user, loading } = useCurrentUser();
  const router = useRouter();
  const { render, redirectTo } = guardOutcome(access, { user, loading });

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (!render) {
    return (
      <div className='min-h-screen bg-slate-950 p-6'>
        <LoadingState fullScreen />
      </div>
    );
  }

  return <>{children}</>;
}
