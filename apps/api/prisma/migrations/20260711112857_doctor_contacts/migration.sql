-- AlterTable
ALTER TABLE "doctors" ADD COLUMN     "bookingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "clinicName" TEXT,
ADD COLUMN     "phone" TEXT;
