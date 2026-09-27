-- Dedupe existing ExpensePayment rows before enforcing one row per guest per expense.
-- Rows with a null tempName (every registered-member row that hasn't had its account
-- deleted) are left alone: a unique index treats NULLs as distinct, so they never collide.
DELETE FROM "ExpensePayment" p
WHERE p."tempName" IS NOT NULL
AND p.id NOT IN (
  SELECT DISTINCT ON ("expenseId", "tempName") id
  FROM "ExpensePayment"
  WHERE "tempName" IS NOT NULL
  ORDER BY "expenseId", "tempName", "createdAt" ASC, id ASC
);

-- Lets a guest split member's payment be addressed by (expenseId, tempName), the same
-- way a registered member's is addressed by (expenseId, userId).
CREATE UNIQUE INDEX "ExpensePayment_expenseId_tempName_key" ON "ExpensePayment"("expenseId", "tempName");
