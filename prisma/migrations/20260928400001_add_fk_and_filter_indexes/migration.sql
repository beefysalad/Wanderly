-- CreateIndex
CREATE INDEX "Activity_tripId_date_idx" ON "Activity"("tripId", "date");

-- CreateIndex
CREATE INDEX "Budget_tripId_createdAt_idx" ON "Budget"("tripId", "createdAt");

-- CreateIndex
CREATE INDEX "Budget_activityId_idx" ON "Budget"("activityId");

-- CreateIndex
CREATE INDEX "Expense_tripId_date_idx" ON "Expense"("tripId", "date");

-- CreateIndex
CREATE INDEX "Expense_groupId_idx" ON "Expense"("groupId");

-- CreateIndex
CREATE INDEX "Expense_paidById_idx" ON "Expense"("paidById");

-- CreateIndex
CREATE INDEX "Expense_createdById_idx" ON "Expense"("createdById");

-- CreateIndex
CREATE INDEX "Expense_activityId_idx" ON "Expense"("activityId");

-- CreateIndex
CREATE INDEX "ExpensePayment_userId_idx" ON "ExpensePayment"("userId");

-- CreateIndex
CREATE INDEX "ExpenseSplit_expenseId_idx" ON "ExpenseSplit"("expenseId");

-- CreateIndex
CREATE INDEX "ExpenseSplit_userId_idx" ON "ExpenseSplit"("userId");

-- CreateIndex
CREATE INDEX "Group_createdById_idx" ON "Group"("createdById");

-- CreateIndex
CREATE INDEX "GroupMember_userId_idx" ON "GroupMember"("userId");

-- CreateIndex
CREATE INDEX "Notification_relatedGroupId_idx" ON "Notification"("relatedGroupId");

-- CreateIndex
CREATE INDEX "Notification_relatedTripId_idx" ON "Notification"("relatedTripId");

-- CreateIndex
CREATE INDEX "Notification_relatedExpenseId_idx" ON "Notification"("relatedExpenseId");

-- CreateIndex
CREATE INDEX "Notification_relatedActivityId_idx" ON "Notification"("relatedActivityId");

-- CreateIndex
CREATE INDEX "PaymentLog_tripId_timestamp_idx" ON "PaymentLog"("tripId", "timestamp");

-- CreateIndex
CREATE INDEX "PaymentLog_payerId_idx" ON "PaymentLog"("payerId");

-- CreateIndex
CREATE INDEX "PaymentLog_payeeId_idx" ON "PaymentLog"("payeeId");

-- CreateIndex
CREATE INDEX "Trip_groupId_createdAt_idx" ON "Trip"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "Trip_createdById_idx" ON "Trip"("createdById");

