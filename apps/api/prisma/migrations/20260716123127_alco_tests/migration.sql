-- CreateTable
CREATE TABLE "alco_tests" (
    "id" TEXT NOT NULL,
    "deviceType" TEXT,
    "carLicense" TEXT,
    "checkValue" TEXT,
    "checkValueNum" DOUBLE PRECISION,
    "positive" BOOLEAN NOT NULL DEFAULT false,
    "checkDateTime" TIMESTAMP(3),
    "uploadTime" TIMESTAMP(3),
    "driverName" TEXT,
    "officerName" TEXT,
    "officerId" TEXT,
    "officerUnit" TEXT,
    "address" TEXT,
    "photoKey" TEXT,
    "raw" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alco_tests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "alco_tests_checkDateTime_idx" ON "alco_tests"("checkDateTime");

-- CreateIndex
CREATE INDEX "alco_tests_createdAt_idx" ON "alco_tests"("createdAt");
