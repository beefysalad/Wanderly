-- Money is stored to the centavo. Casting to DECIMAL(12,2) rounds existing values half away from zero
-- (33.3333… becomes 33.33, 33.335 becomes 33.34); the rows affected are mostly payment logs that stored
-- amount / split count. A value of 10,000,000,000 or more would make this fail rather than be truncated.

-- AlterTable
ALTER TABLE "Budget" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Expense" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "ExpensePayment" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "PaymentLog" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);
