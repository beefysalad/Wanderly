/*
  Warnings:

  - The required column `id` was added to the `User` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "imageUrl" TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
