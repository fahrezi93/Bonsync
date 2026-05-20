ALTER TABLE "MonthlyBudget"
  ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL DEFAULT 'legacy';

ALTER TABLE "Receipt"
  ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL DEFAULT 'legacy';

ALTER TABLE "Expense"
  ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL DEFAULT 'legacy';

DROP INDEX IF EXISTS "MonthlyBudget_month_key";

CREATE UNIQUE INDEX IF NOT EXISTS "MonthlyBudget_userId_month_key"
  ON "MonthlyBudget"("userId", "month");

CREATE INDEX IF NOT EXISTS "MonthlyBudget_userId_idx"
  ON "MonthlyBudget"("userId");

CREATE INDEX IF NOT EXISTS "Receipt_userId_idx"
  ON "Receipt"("userId");

CREATE INDEX IF NOT EXISTS "Expense_userId_date_idx"
  ON "Expense"("userId", "date");
