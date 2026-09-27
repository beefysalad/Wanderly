"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect } from "react";
// import { auth } from "@/lib/firebase/admin/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Socket events and mutations invalidate what they change, so a short freshness window
            // only stops every remount (switching trip tabs, back navigation, window focus) from
            // refetching the same group and trip data again. Budgets have no socket event, so this
            // also bounds how long another member's budget change can go unseen.
            staleTime: 30_000,
            retry: 1,
          },
        },
      })
  );

  // Clear cache when user logs out
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // User logged out - clear all cached data
        queryClient.clear();
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
