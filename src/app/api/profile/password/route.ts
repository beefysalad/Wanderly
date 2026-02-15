import { withAuth, type AuthContext } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { userAuth } from "@/lib/firebase-admin";

async function handler(req: NextRequest, context: AuthContext) {
  try {
    if (req.method !== "PATCH") {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 },
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const uid = context.decodedToken.uid;
    const email = context.decodedToken.email;

    if (!email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 },
      );
    }

    // Verify current password using Firebase Auth REST API
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      logger.error("Firebase API Key missing in environment");
      return NextResponse.json(
        { error: "Internal server error: Configuration missing" },
        { status: 500 },
      );
    }

    try {
      const verifyResponse = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password: currentPassword,
            returnSecureToken: true,
          }),
        },
      );

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        const firebaseError = errorData.error?.message;

        if (
          firebaseError === "INVALID_PASSWORD" ||
          firebaseError === "INVALID_LOGIN_CREDENTIALS"
        ) {
          return NextResponse.json(
            { error: "Incorrect current password" },
            { status: 401 },
          );
        }

        logger.error("Firebase verification failed", errorData);
        return NextResponse.json(
          { error: "Failed to verify current password" },
          { status: 401 },
        );
      }
    } catch (err) {
      logger.error("Error during password verification fetch", err);
      return NextResponse.json(
        { error: "Failed to verify current password" },
        { status: 500 },
      );
    }

    // Get the current user from Firebase Auth
    if (!userAuth) {
      return NextResponse.json(
        { error: "Firebase Admin not initialized" },
        { status: 500 },
      );
    }

    const firebaseUser = await userAuth.getUser(uid);
    if (!firebaseUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update password using Firebase Admin SDK
    await userAuth.updateUser(uid, {
      password: newPassword,
    });

    logger.info("Password updated successfully", {
      uid,
    });

    return NextResponse.json(
      {
        message: "Password updated successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error("Error updating password", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const PATCH = withAuth(handler);
