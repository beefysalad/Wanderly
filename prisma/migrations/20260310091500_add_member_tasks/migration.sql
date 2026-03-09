-- CreateEnum
CREATE TYPE "MemberTaskStatus" AS ENUM ('not_started', 'in_progress', 'done');

-- CreateTable
CREATE TABLE "MemberTask" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" "MemberTaskStatus" NOT NULL DEFAULT 'not_started',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemberTask_groupId_idx" ON "MemberTask"("groupId");

-- CreateIndex
CREATE INDEX "MemberTask_assignedToId_idx" ON "MemberTask"("assignedToId");

-- CreateIndex
CREATE INDEX "MemberTask_groupId_status_idx" ON "MemberTask"("groupId", "status");

-- AddForeignKey
ALTER TABLE "MemberTask" ADD CONSTRAINT "MemberTask_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberTask" ADD CONSTRAINT "MemberTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberTask" ADD CONSTRAINT "MemberTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
