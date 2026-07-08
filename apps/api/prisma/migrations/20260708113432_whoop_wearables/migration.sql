-- CreateEnum
CREATE TYPE "WearableProvider" AS ENUM ('WHOOP');

-- CreateEnum
CREATE TYPE "WearableStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'ERROR');

-- CreateTable
CREATE TABLE "wearable_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "WearableProvider" NOT NULL,
    "status" "WearableStatus" NOT NULL DEFAULT 'CONNECTED',
    "providerUserId" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "scope" TEXT,
    "expiresAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wearable_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whoop_snapshots" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recoveryScore" INTEGER,
    "hrvMs" DOUBLE PRECISION,
    "restingHr" INTEGER,
    "spo2" DOUBLE PRECISION,
    "skinTempC" DOUBLE PRECISION,
    "recoveryAt" TIMESTAMP(3),
    "sleepPerformance" INTEGER,
    "sleepTotalMinutes" INTEGER,
    "sleepLightMin" INTEGER,
    "sleepDeepMin" INTEGER,
    "sleepRemMin" INTEGER,
    "sleepAwakeMin" INTEGER,
    "respiratoryRate" DOUBLE PRECISION,
    "sleepAt" TIMESTAMP(3),
    "dayStrain" DOUBLE PRECISION,
    "avgHr" INTEGER,
    "maxHr" INTEGER,
    "cycleAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whoop_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wearable_connections_userId_idx" ON "wearable_connections"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "wearable_connections_userId_provider_key" ON "wearable_connections"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "whoop_snapshots_connectionId_key" ON "whoop_snapshots"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "whoop_snapshots_userId_key" ON "whoop_snapshots"("userId");

-- AddForeignKey
ALTER TABLE "wearable_connections" ADD CONSTRAINT "wearable_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whoop_snapshots" ADD CONSTRAINT "whoop_snapshots_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "wearable_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
