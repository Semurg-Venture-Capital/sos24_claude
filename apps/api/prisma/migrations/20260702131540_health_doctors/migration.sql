-- AlterTable
ALTER TABLE "partner_bookings" ADD COLUMN     "doctorId" TEXT;

-- CreateTable
CREATE TABLE "doctors" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT,
    "fullName" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "experienceY" INTEGER,
    "bio" TEXT,
    "photoKey" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "pricePrimary" INTEGER,
    "priceRepeat" INTEGER,
    "priceVideo" INTEGER,
    "videoEnabled" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "workingHours" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "doctors_partnerId_idx" ON "doctors"("partnerId");

-- CreateIndex
CREATE INDEX "doctors_specialty_idx" ON "doctors"("specialty");

-- CreateIndex
CREATE INDEX "partner_bookings_doctorId_scheduledAt_idx" ON "partner_bookings"("doctorId", "scheduledAt");

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_bookings" ADD CONSTRAINT "partner_bookings_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
