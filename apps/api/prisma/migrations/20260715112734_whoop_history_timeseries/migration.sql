-- CreateTable
CREATE TABLE "whoop_recovery_days" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "recoveryScore" INTEGER,
    "hrvMs" DOUBLE PRECISION,
    "restingHr" INTEGER,
    "spo2" DOUBLE PRECISION,
    "skinTempC" DOUBLE PRECISION,
    "scoredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whoop_recovery_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whoop_sleeps" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "whoopId" TEXT,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "performancePct" INTEGER,
    "efficiencyPct" INTEGER,
    "consistencyPct" INTEGER,
    "inBedMin" INTEGER,
    "lightMin" INTEGER,
    "deepMin" INTEGER,
    "remMin" INTEGER,
    "awakeMin" INTEGER,
    "needMin" INTEGER,
    "respiratoryRate" DOUBLE PRECISION,
    "disturbanceCount" INTEGER,
    "cycleCount" INTEGER,
    "isNap" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whoop_sleeps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whoop_cycle_days" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "strain" DOUBLE PRECISION,
    "kilojoule" DOUBLE PRECISION,
    "avgHr" INTEGER,
    "maxHr" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whoop_cycle_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whoop_workouts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "whoopId" TEXT,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "sport" TEXT,
    "strain" DOUBLE PRECISION,
    "avgHr" INTEGER,
    "maxHr" INTEGER,
    "kilojoule" DOUBLE PRECISION,
    "distanceM" DOUBLE PRECISION,
    "zoneMin" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whoop_workouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "whoop_recovery_days_userId_date_idx" ON "whoop_recovery_days"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "whoop_recovery_days_userId_date_key" ON "whoop_recovery_days"("userId", "date");

-- CreateIndex
CREATE INDEX "whoop_sleeps_userId_start_idx" ON "whoop_sleeps"("userId", "start");

-- CreateIndex
CREATE UNIQUE INDEX "whoop_sleeps_userId_start_key" ON "whoop_sleeps"("userId", "start");

-- CreateIndex
CREATE INDEX "whoop_cycle_days_userId_date_idx" ON "whoop_cycle_days"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "whoop_cycle_days_userId_date_key" ON "whoop_cycle_days"("userId", "date");

-- CreateIndex
CREATE INDEX "whoop_workouts_userId_start_idx" ON "whoop_workouts"("userId", "start");

-- CreateIndex
CREATE UNIQUE INDEX "whoop_workouts_userId_start_key" ON "whoop_workouts"("userId", "start");
