-- CreateEnum
CREATE TYPE "RoastPersona" AS ENUM ('DEFAULT', 'MAMA', 'SULTAN', 'TETANGGA', 'DOSEN');

-- AlterTable
ALTER TABLE "MonthlyBudget" ADD COLUMN "roastPersona" "RoastPersona" NOT NULL DEFAULT 'DEFAULT';
