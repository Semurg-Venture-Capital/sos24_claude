CREATE TYPE "IncidentType" AS ENUM ('ACCIDENT', 'DAMAGE', 'THEFT');
CREATE TYPE "AdjusterStatus" AS ENUM ('NEW', 'ACCEPTED', 'EN_ROUTE', 'COMPLETED', 'CANCELLED');

CREATE TABLE "adjuster_requests" (
    "id"           TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "policyId"     TEXT,
    "incidentType" "IncidentType" NOT NULL,
    "address"      TEXT NOT NULL,
    "lat"          DOUBLE PRECISION,
    "lng"          DOUBLE PRECISION,
    "comment"      TEXT,
    "status"       "AdjusterStatus" NOT NULL DEFAULT 'NEW',
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adjuster_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "adjuster_requests_userId_idx"         ON "adjuster_requests"("userId");
CREATE INDEX "adjuster_requests_status_createdAt_idx" ON "adjuster_requests"("status", "createdAt");

ALTER TABLE "adjuster_requests"
    ADD CONSTRAINT "adjuster_requests_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
