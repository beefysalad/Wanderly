"use client";

import { createContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/src/lib/firebase";

export interface AuthState {
  user: User | null;
  /** True until Firebase reports the initial auth state. */
  loading: boolean;
}

export const AuthContext = createContext<AuthState | null>(null);

/** One `onAuthStateChanged` subscription for the whole app; read it with `useCurrentUser`. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => onAuthStateChanged(auth, (user) => setState({ user, loading: false })), []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
