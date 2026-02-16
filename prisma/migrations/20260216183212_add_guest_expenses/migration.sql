-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_paidById_fkey";

-- DropIndex
DROP INDEX "ExpenseSplit_expenseId_userId_key";

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "tempPaidBy" TEXT,
ALTER COLUMN "paidById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ExpenseSplit" ADD COLUMN     "tempName" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
