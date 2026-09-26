-- DropForeignKey
ALTER TABLE "MemberTask" DROP CONSTRAINT "MemberTask_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "MemberTask" DROP CONSTRAINT "MemberTask_createdById_fkey";

-- DropForeignKey
ALTER TABLE "MemberTask" DROP CONSTRAINT "MemberTask_groupId_fkey";

-- DropTable
DROP TABLE "MemberTask";

-- DropEnum
DROP TYPE "MemberTaskStatus";
