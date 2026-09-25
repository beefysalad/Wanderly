import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";

/** The signed-in user's database id (not the Firebase uid), once it has been fetched. */
export function useCurrentDbUserId() {
  const { user: firebaseUser } = useCurrentUser();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (firebaseUser) {
      api
        .get("/sync")
        .then((res) => {
          if (res.data?.user?.id) {
            setCurrentUserId(res.data.user.id);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch user ID:", err);
        });
    }
  }, [firebaseUser]);

  return currentUserId;
}
