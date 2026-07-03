-- CreateTable
CREATE TABLE "triage_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messages" TEXT,
    "symptoms" TEXT,
    "verdict" TEXT,
    "urgency" TEXT,
    "confidence" INTEGER,
    "step" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "triage_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "triage_sessions_userId_createdAt_idx" ON "triage_sessions"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "triage_sessions" ADD CONSTRAINT "triage_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
