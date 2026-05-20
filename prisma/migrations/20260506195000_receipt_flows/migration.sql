-- Drop legacy tables from old schema if present.
DROP TABLE IF EXISTS "TransactionItem";
DROP TABLE IF EXISTS "Transaction";

DO $$
BEGIN
  CREATE TYPE "ExpenseSource" AS ENUM ('MANUAL', 'QUICK_RECEIPT', 'SPLIT_BILL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "ReceiptMode" AS ENUM ('QUICK', 'SPLIT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "ReceiptItemOwner" AS ENUM ('SELF', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "MonthlyBudget" (
  "id" TEXT NOT NULL,
  "limitAmount" DOUBLE PRECISION NOT NULL,
  "month" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MonthlyBudget_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MonthlyBudget_month_key" ON "MonthlyBudget"("month");

CREATE TABLE IF NOT EXISTS "Receipt" (
  "id" TEXT NOT NULL,
  "merchantName" TEXT NOT NULL,
  "subtotalAmount" DOUBLE PRECISION NOT NULL,
  "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "serviceChargeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "mode" "ReceiptMode" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Receipt"
  ADD COLUMN IF NOT EXISTS "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "ReceiptItem" (
  "id" TEXT NOT NULL,
  "receiptId" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "ownerType" "ReceiptItemOwner" NOT NULL,
  CONSTRAINT "ReceiptItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Expense" (
  "id" TEXT NOT NULL,
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "category" TEXT NOT NULL,
  "aiAdvice" TEXT NOT NULL,
  "isSplitBill" BOOLEAN NOT NULL DEFAULT false,
  "source" "ExpenseSource" NOT NULL DEFAULT 'MANUAL',
  "receiptId" TEXT,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Expense"
  ADD COLUMN IF NOT EXISTS "source" "ExpenseSource" NOT NULL DEFAULT 'MANUAL';

ALTER TABLE "Expense"
  ADD COLUMN IF NOT EXISTS "receiptId" TEXT;

UPDATE "Expense" SET "source" = 'MANUAL' WHERE "source" IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ReceiptItem_receiptId_fkey'
  ) THEN
    ALTER TABLE "ReceiptItem"
      ADD CONSTRAINT "ReceiptItem_receiptId_fkey"
      FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Expense_receiptId_fkey'
  ) THEN
    ALTER TABLE "Expense"
      ADD CONSTRAINT "Expense_receiptId_fkey"
      FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
