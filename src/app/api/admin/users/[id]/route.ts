import { userAuth } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const adminPassword = req.headers.get("x-admin-password");
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
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

    // 2. Delete from Firebase first (to prevent orphaned auth records if DB fails, though transaction better?
    // Actually, usually better to delete DB first or do it in parallel.
    // If DB delete fails, we don't want to delete auth.
    // If Auth delete fails, we might still want to delete DB or keep it consistent.
    // Let's try Firebase delete first, if it fails because user not found that's fine.)

    if (userAuth && user.firebaseId) {
      try {
        await userAuth.deleteUser(user.firebaseId);
        logger.info(`Admin: Deleted Firebase user ${user.firebaseId}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (fbError: any) {
        if (fbError.code === "auth/user-not-found") {
          logger.warn(
            `Admin: Firebase user ${user.firebaseId} not found, skipping.`,
          );
        } else {
          logger.error(
            `Admin: Failed to delete Firebase user ${user.firebaseId}`,
            fbError,
          );
          return NextResponse.json(
            { error: "Failed to delete from Firebase provider" },
            { status: 500 },
          );
        }
      }
    }

    // 3. Delete from Prisma
    await prisma.user.delete({
      where: { id },
    });

    logger.info(`Admin: Deleted user ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Admin: Failed to delete user", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
