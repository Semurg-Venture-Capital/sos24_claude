-- Add ADJUSTER role to UserRole enum
-- NOTE: ALTER TYPE ADD VALUE cannot run inside a transaction in PG < 12.
-- On modern PostgreSQL (12+) this is safe in a transaction.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ADJUSTER';

-- Add adjuster assignment columns to adjuster_requests
ALTER TABLE "adjuster_requests"
  ADD COLUMN "assigned_adjuster_id" TEXT,
  ADD COLUMN "adjuster_name"        TEXT,
  ADD COLUMN "adjuster_phone"       TEXT;

-- Foreign key: assigned_adjuster_id → users
ALTER TABLE "adjuster_requests"
  ADD CONSTRAINT "adjuster_requests_assigned_adjuster_id_fkey"
  FOREIGN KEY ("assigned_adjuster_id")
  REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Index for assigned_adjuster_id lookups
CREATE INDEX "adjuster_requests_assigned_adjuster_id_idx"
  ON "adjuster_requests"("assigned_adjuster_id");
