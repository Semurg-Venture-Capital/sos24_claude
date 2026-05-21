-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NOT_VERIFIED', 'MYID_VERIFIED');

-- AlterTable
ALTER TABLE "users"
  ADD COLUMN "pinfl" TEXT,
  ADD COLUMN "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'NOT_VERIFIED';

-- CreateIndex
CREATE UNIQUE INDEX "users_pinfl_key" ON "users"("pinfl");
