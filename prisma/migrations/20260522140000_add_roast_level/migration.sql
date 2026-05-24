-- CreateEnum
CREATE TYPE "RoastLevel" AS ENUM ('MILD', 'MEDIUM', 'NUCLEAR');

-- AlterTable
ALTER TABLE "MonthlyBudget" ADD COLUMN "roastLevel" "RoastLevel" NOT NULL DEFAULT 'MEDIUM';
