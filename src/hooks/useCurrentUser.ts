import { useContext } from "react";
import { AuthContext, type AuthState } from "@/src/components/auth-provider";

/** The Firebase user and whether its initial state is still loading, from the app-wide `AuthProvider`. */
export function useCurrentUser(): AuthState {
  const state = useContext(AuthContext);
  if (!state) throw new Error("useCurrentUser must be used inside <AuthProvider>");
  return state;
}
