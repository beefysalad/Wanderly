import { withAuth, type AuthContext } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { userAuth } from "@/lib/firebase-admin";
import { syncUserToDatabaseService } from "../sync/syncService";
import prisma from "@/lib/prisma";

async function handler(req: NextRequest, context: AuthContext) {
  try {
    if (req.method === "GET") {
      // Sync to database to ensure we have the latest data including new fields
      const user = await syncUserToDatabaseService(context.decodedToken, false);
      return NextResponse.json({ user }, { status: 200 });
    }

    if (req.method !== "PATCH") {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 },
      );
    }

    if (!userAuth) {
      return NextResponse.json(
        { error: "Firebase admin not initialized" },
        { status: 500 },
      );
    }

    const body = await req.json();
    const { name, photoURL, bio, travelStyle } = body;

    // Validate that at least one field is provided
    if (
      name === undefined &&
      photoURL === undefined &&
      bio === undefined &&
      travelStyle === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "At least one field (name, photoURL, bio, or travelStyle) must be provided",
        },
        { status: 400 },
      );
    }

    const uid = context.decodedToken.uid;

    // 1. If Firebase-managed fields are present, update Firebase Auth
    if (name !== undefined || photoURL !== undefined) {
      const updateData: {
        displayName?: string;
        photoURL?: string;
      } = {};

      if (name !== undefined) updateData.displayName = name;
      if (photoURL !== undefined) updateData.photoURL = photoURL;

      await userAuth.updateUser(uid, updateData);

      logger.info("Firebase Auth profile updated", {
        uid,
        updates: Object.keys(updateData),
      });
    }

    // 2. If metadata fields are present, update Prisma directly
    if (bio !== undefined || travelStyle !== undefined) {
      await prisma.user.update({
        where: { firebaseId: uid },
        data: {
          ...(bio !== undefined && { bio }),
          ...(travelStyle !== undefined && { travelStyle }),
        },
      });

      logger.info("Prisma profile metadata updated", {
        uid,
        hasBio: bio !== undefined,
        hasTravelStyle: travelStyle !== undefined,
      });
    }

    // 3. Sync to database (ensures Firebase fields are updated in Prisma too)
    const syncedUser = await syncUserToDatabaseService(
      context.decodedToken,
      true,
    );

    return NextResponse.json(
      {
        message: "Profile updated successfully",
        user: syncedUser,
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error("Error updating profile", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withAuth(handler);
export const PATCH = withAuth(handler);
