-- Drop legacy unique index that constrained `month` alone.
-- The proper unique constraint is `("userId", "month")` from the
-- 20260519153500_add_user_ownership migration. Production environments
-- where the previous DROP INDEX IF EXISTS did not run still have this
-- legacy index, which caused: Unique constraint failed on the fields: (`month`)
-- when a second user tries to set a budget for the same month.

DROP INDEX IF EXISTS "MonthlyBudget_month_key";

-- Defensive: in case it was created as a constraint at some point,
-- also drop it as a constraint (no-op if it doesn't exist as one).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = '"MonthlyBudget"'::regclass
      AND conname = 'MonthlyBudget_month_key'
  ) THEN
    ALTER TABLE "MonthlyBudget" DROP CONSTRAINT "MonthlyBudget_month_key";
  END IF;
END $$;
