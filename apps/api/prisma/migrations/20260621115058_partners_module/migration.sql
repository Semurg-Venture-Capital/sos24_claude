-- CreateEnum
CREATE TYPE "PartnerBookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PARTNER_BOOKING';

-- AlterTable
ALTER TABLE "partners" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "coverKey" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "logoKey" TEXT,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "workingHours" JSONB,
ALTER COLUMN "type" DROP NOT NULL;

-- CreateTable
CREATE TABLE "partner_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_services" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceFrom" INTEGER,
    "priceTo" INTEGER,
    "durationMin" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_reviews" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT,
    "rating" INTEGER NOT NULL,
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_bookings" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "policyId" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "PartnerBookingStatus" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BookingServices" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BookingServices_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "partner_categories_slug_key" ON "partner_categories"("slug");

-- CreateIndex
CREATE INDEX "partner_services_partnerId_idx" ON "partner_services"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_reviews_bookingId_key" ON "partner_reviews"("bookingId");

-- CreateIndex
CREATE INDEX "partner_reviews_partnerId_createdAt_idx" ON "partner_reviews"("partnerId", "createdAt");

-- CreateIndex
CREATE INDEX "partner_bookings_partnerId_scheduledAt_idx" ON "partner_bookings"("partnerId", "scheduledAt");

-- CreateIndex
CREATE INDEX "partner_bookings_userId_createdAt_idx" ON "partner_bookings"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "_BookingServices_B_index" ON "_BookingServices"("B");

-- CreateIndex
CREATE INDEX "partners_categoryId_idx" ON "partners"("categoryId");

-- AddForeignKey
ALTER TABLE "partners" ADD CONSTRAINT "partners_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "partner_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_services" ADD CONSTRAINT "partner_services_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_reviews" ADD CONSTRAINT "partner_reviews_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_reviews" ADD CONSTRAINT "partner_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_reviews" ADD CONSTRAINT "partner_reviews_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "partner_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_bookings" ADD CONSTRAINT "partner_bookings_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_bookings" ADD CONSTRAINT "partner_bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BookingServices" ADD CONSTRAINT "_BookingServices_A_fkey" FOREIGN KEY ("A") REFERENCES "partner_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BookingServices" ADD CONSTRAINT "_BookingServices_B_fkey" FOREIGN KEY ("B") REFERENCES "partner_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
