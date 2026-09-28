-- Drop the never-written ExpensePayment.amount column.
ALTER TABLE "ExpensePayment" DROP COLUMN "amount";

-- Dedupe existing PaymentLog rows before enforcing one log per member share.
-- Rows with a null payerId (payer account deleted) are left alone: a unique
-- index treats NULLs as distinct, so they never collide anyway.
DELETE FROM "PaymentLog" p
WHERE p."payerId" IS NOT NULL
AND p.id NOT IN (
  SELECT DISTINCT ON ("expenseId", "payerId") id
  FROM "PaymentLog"
  WHERE "payerId" IS NOT NULL
  ORDER BY "expenseId", "payerId", "createdAt" ASC, id ASC
);

-- One payment log per member's share of an expense.
CREATE UNIQUE INDEX "PaymentLog_expenseId_payerId_key" ON "PaymentLog"("expenseId", "payerId");
