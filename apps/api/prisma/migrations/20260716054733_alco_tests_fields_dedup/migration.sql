-- AlcoTest: доп. поля (серийник, номер, единица, режим, координаты, водитель) + дедуп
ALTER TABLE "alco_tests"
  ADD COLUMN "deviceNo" TEXT,
  ADD COLUMN "number" INTEGER,
  ADD COLUMN "checkValueUnit" TEXT,
  ADD COLUMN "checkMode" TEXT,
  ADD COLUMN "latitude" DOUBLE PRECISION,
  ADD COLUMN "longitude" DOUBLE PRECISION,
  ADD COLUMN "sourceType" TEXT,
  ADD COLUMN "driverNo" TEXT,
  ADD COLUMN "licenseType" TEXT;

CREATE UNIQUE INDEX "alco_tests_deviceNo_checkDateTime_key" ON "alco_tests"("deviceNo", "checkDateTime");
