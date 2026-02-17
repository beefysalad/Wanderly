import { userAuth } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import { verifyAdminPassword } from "@/lib/admin-auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const adminPassword = req.headers.get("x-admin-password");
    if (!(await verifyAdminPassword(adminPassword))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 1. Get user to find firebaseId
    const user = await prisma.user.findUnique({
      where: { id },
      select: { firebaseId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Database Deletion (Transaction)
    // Reordered: Delete groups first, then the user.
    // This ensures we don't leave orphaned data if cascades fail or if we want explicit control.
    try {
      await prisma.$transaction(async (tx) => {
        // Delete all groups created by this user
        // Note: Prisma schema has onDelete: Cascade for trips, memberships, etc.
        await tx.group.deleteMany({
          where: { createdById: id },
        });

        // Delete the user record
        await tx.user.delete({
          where: { id },
        });
      });

      logger.info(`Admin: Deleted user ${id} and their created groups from DB`);
    } catch (dbError) {
      logger.error(`Admin: Failed to delete user ${id} from DB`, dbError);
      return NextResponse.json(
        { error: "Failed to delete user from database" },
        { status: 500 },
      );
    }

    // 3. Delete from Firebase ONLY after successful DB deletion
    if (userAuth && user.firebaseId) {
      try {
        await userAuth.deleteUser(user.firebaseId);
        logger.info(`Admin: Deleted Firebase user ${user.firebaseId}`);
      } catch (fbError: unknown) {
        if (
          fbError &&
          typeof fbError === "object" &&
          "code" in fbError &&
          fbError.code === "auth/user-not-found"
        ) {
          logger.warn(
            `Admin: Firebase user ${user.firebaseId} not found, skipping.`,
          );
        } else {
          logger.error(
            `Admin: Failed to delete Firebase user ${user.firebaseId}`,
            fbError,
          );
          // Note: We've already deleted from DB, so we return success but include a warning
          // because the user is effectively "gone" from the app's perspective.
          return NextResponse.json({ 
            success: true, 
            warning: "User deleted from DB but failed to remove from Firebase provider" 
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Admin: Deletion process error", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
