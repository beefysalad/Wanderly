import { userAuth } from "@/lib/firebase-admin";

export interface FirebaseUserInfo {
  lastSignInTime?: string;
  creationTime?: string;
  emailVerified: boolean;
  disabled: boolean;
}

const LOOKUP_BATCH_SIZE = 100; // Firebase getUsers() accepts at most 100 identifiers

/** Sign-in metadata for the given Firebase uids, keyed by uid. Empty when Firebase isn't configured. */
export async function getFirebaseUserInfo(uids: string[]) {
  const infoByUid: Record<string, FirebaseUserInfo> = {};
  if (!userAuth || uids.length === 0) return infoByUid;

  for (let i = 0; i < uids.length; i += LOOKUP_BATCH_SIZE) {
    const batch = uids.slice(i, i + LOOKUP_BATCH_SIZE);
    const result = await userAuth.getUsers(batch.map((uid) => ({ uid })));
    result.users.forEach((fbUser) => {
      infoByUid[fbUser.uid] = {
        lastSignInTime: fbUser.metadata.lastSignInTime,
        creationTime: fbUser.metadata.creationTime,
        emailVerified: fbUser.emailVerified,
        disabled: fbUser.disabled,
      };
    });
  }

  return infoByUid;
}

export type FirebaseDeleteResult = "deleted" | "not-found" | "skipped";

/** Deletes the Firebase account; "not-found" means it was already gone. Other errors throw. */
export async function deleteFirebaseUser(uid: string): Promise<FirebaseDeleteResult> {
  if (!userAuth) return "skipped";

  try {
    await userAuth.deleteUser(uid);
    return "deleted";
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "auth/user-not-found") {
      return "not-found";
    }
    throw error;
  }
}
