import { withAuth, type AuthContext } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { userAuth } from "@/lib/firebase-admin";

async function handler(req: NextRequest, context: AuthContext) {
  try {
    if (req.method !== "PATCH") {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const uid = context.decodedToken.uid;
    const email = context.decodedToken.email;

    if (!email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // Get the current user from Firebase Auth
    const firebaseUser = await userAuth?.getUser(uid);
    if (!firebaseUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!userAuth) {
      return NextResponse.json(
        { error: "Firebase Admin not initialized" },
        { status: 500 }
      );
    }
    // Update password using Firebase Admin SDK
    // Note: The client should verify the current password before calling this endpoint
    // Admin SDK can update password directly (used for admin operations)
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
      { status: 200 }
    );
  } catch (error) {
    logger.error("Error updating password", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const PATCH = withAuth(handler);
