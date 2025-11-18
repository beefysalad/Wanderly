-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'group_leave';
ALTER TYPE "NotificationType" ADD VALUE 'activity_edited';
ALTER TYPE "NotificationType" ADD VALUE 'activity_deleted';
ALTER TYPE "NotificationType" ADD VALUE 'expense_edited';
ALTER TYPE "NotificationType" ADD VALUE 'expense_deleted';
ALTER TYPE "NotificationType" ADD VALUE 'trip_deleted';
