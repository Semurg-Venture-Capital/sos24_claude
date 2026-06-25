-- Колл-центр (Asterisk/ARI): журнал звонков.

CREATE TYPE "CallDirection" AS ENUM ('INBOUND_EXTERNAL', 'INBOUND_APP', 'OUTBOUND');
CREATE TYPE "CallStatus" AS ENUM ('RINGING', 'ANSWERED', 'MISSED', 'COMPLETED', 'FAILED');

CREATE TABLE "calls" (
    "id" TEXT NOT NULL,
    "direction" "CallDirection" NOT NULL,
    "status" "CallStatus" NOT NULL DEFAULT 'RINGING',
    "channel_id" TEXT,
    "linked_id" TEXT,
    "queue" TEXT,
    "external_number" TEXT,
    "user_id" TEXT,
    "operator_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answered_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "duration_sec" INTEGER,
    "wait_sec" INTEGER,
    "recording_key" TEXT,
    "ticket_id" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "calls_channel_id_key" ON "calls"("channel_id");
CREATE INDEX "calls_status_started_at_idx" ON "calls"("status", "started_at");
CREATE INDEX "calls_operator_id_started_at_idx" ON "calls"("operator_id", "started_at");
CREATE INDEX "calls_user_id_started_at_idx" ON "calls"("user_id", "started_at");
CREATE INDEX "calls_direction_started_at_idx" ON "calls"("direction", "started_at");

ALTER TABLE "calls" ADD CONSTRAINT "calls_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "calls" ADD CONSTRAINT "calls_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "calls" ADD CONSTRAINT "calls_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
