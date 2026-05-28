CREATE TABLE "TransferAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "bankName" TEXT NOT NULL,
  "accountNumber" TEXT NOT NULL,
  "accountHolder" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TransferAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TransferAccount_userId_label_key" ON "TransferAccount"("userId", "label");
CREATE INDEX "TransferAccount_userId_createdAt_idx" ON "TransferAccount"("userId", "createdAt");
