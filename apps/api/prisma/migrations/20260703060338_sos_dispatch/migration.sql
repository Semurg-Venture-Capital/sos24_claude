-- CreateEnum
CREATE TYPE "SosNotifyStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'SOS_ALERT';

-- AlterTable
ALTER TABLE "sos_alerts" ADD COLUMN     "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "dispatcherId" TEXT,
ADD COLUMN     "note" TEXT;

-- CreateTable
CREATE TABLE "sos_notifications" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'SMS',
    "status" "SosNotifyStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sos_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sos_notifications_alertId_idx" ON "sos_notifications"("alertId");

-- CreateIndex
CREATE INDEX "sos_alerts_status_createdAt_idx" ON "sos_alerts"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "sos_alerts" ADD CONSTRAINT "sos_alerts_dispatcherId_fkey" FOREIGN KEY ("dispatcherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_notifications" ADD CONSTRAINT "sos_notifications_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "sos_alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
