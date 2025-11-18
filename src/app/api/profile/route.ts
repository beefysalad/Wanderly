import { withAuth, type AuthContext } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { userAuth } from "@/lib/firebase-admin";
import { syncUserToDatabaseService } from "../sync/syncService";

async function handler(req: NextRequest, context: AuthContext) {
  try {
    if (req.method !== "PATCH") {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }

    if (!userAuth) {
      return NextResponse.json(
        { error: "Firebase admin not initialized" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { name, photoURL } = body;

    // Validate that at least one field is provided
    if (!name && !photoURL) {
      return NextResponse.json(
        { error: "At least one field (name or photoURL) must be provided" },
        { status: 400 }
      );
    }

    const uid = context.decodedToken.uid;

    // Prepare update object
    const updateData: {
      displayName?: string;
      photoURL?: string;
    } = {};

    if (name !== undefined) {
      updateData.displayName = name;
    }

    if (photoURL !== undefined) {
      updateData.photoURL = photoURL;
    }

    // Update Firebase Auth user
    await userAuth.updateUser(uid, updateData);

    logger.info("Firebase Auth profile updated", {
      uid,
      updates: Object.keys(updateData),
    });

    // Sync to database (force sync to ensure latest Firebase data)
    const syncedUser = await syncUserToDatabaseService(
      context.decodedToken,
      true
    );

    return NextResponse.json(
      {
        message: "Profile updated successfully",
        user: syncedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Error updating profile", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const PATCH = withAuth(handler);

