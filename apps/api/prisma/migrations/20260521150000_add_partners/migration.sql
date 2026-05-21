CREATE TYPE "PartnerType" AS ENUM ('STO', 'CLINIC', 'TOWING');

CREATE TABLE "partners" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "type"      "PartnerType" NOT NULL,
    "address"   TEXT NOT NULL,
    "phone"     TEXT,
    "rating"    DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isOpen"    BOOLEAN NOT NULL DEFAULT true,
    "city"      TEXT NOT NULL DEFAULT 'Ташкент',
    "lat"       DOUBLE PRECISION,
    "lng"       DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "partners_type_idx" ON "partners"("type");
CREATE INDEX "partners_city_idx" ON "partners"("city");
