import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin only if not already initialized and environment variables are available
function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Check if we're in a build environment or if required env vars are missing
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.FIREBASE_PROJECT_ID
  ) {
    console.warn("Firebase Admin: Missing environment variables during build");
    return null;
  }

  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    console.warn("Firebase Admin: Missing required environment variables");
    return null;
  }

  try {
    return initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(
          /\\n/g,
          "\n"
        ),
      }),
    });
  } catch (error) {
    console.error("Firebase Admin initialization failed:", error);
    return null;
  }
}

// Initialize the app
const app = initializeFirebaseAdmin();

// Export auth with error handling
export const userAuth = app ? getAuth(app) : null;
