-- CreateEnum
CREATE TYPE "EuroStatus" AS ENUM ('SUBMITTED', 'REVIEW', 'NEED_INFO', 'APPROVED', 'REJECTED', 'PAID');

-- CreateTable
CREATE TABLE "euro_protocols" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "selfVerified" BOOLEAN NOT NULL DEFAULT false,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "incidentTime" TEXT NOT NULL,
    "place" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "participant_id" TEXT,
    "other_gov" TEXT,
    "other_phone" TEXT,
    "other_vehicle_raw" JSONB,
    "other_policy_seria" TEXT,
    "other_policy_number" TEXT,
    "other_policy_valid" BOOLEAN,
    "scheme_type" TEXT,
    "description" TEXT,
    "photos" JSONB,
    "status" "EuroStatus" NOT NULL DEFAULT 'SUBMITTED',
    "admin_note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "euro_protocols_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "euro_protocols_number_key" ON "euro_protocols"("number");

-- CreateIndex
CREATE INDEX "euro_protocols_userId_idx" ON "euro_protocols"("userId");

-- CreateIndex
CREATE INDEX "euro_protocols_status_createdAt_idx" ON "euro_protocols"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "euro_protocols" ADD CONSTRAINT "euro_protocols_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "euro_protocols" ADD CONSTRAINT "euro_protocols_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "euro_protocols" ADD CONSTRAINT "euro_protocols_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "euro_participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
