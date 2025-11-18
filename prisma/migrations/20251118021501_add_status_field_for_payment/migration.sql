-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'confirmed', 'rejected');

-- AlterTable
ALTER TABLE "ExpensePayment" ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'pending';
