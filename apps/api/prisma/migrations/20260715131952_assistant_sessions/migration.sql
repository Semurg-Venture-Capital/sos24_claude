-- CreateTable
CREATE TABLE "assistant_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messages" TEXT,
    "category" TEXT,
    "urgency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistant_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assistant_sessions_userId_updatedAt_idx" ON "assistant_sessions"("userId", "updatedAt");

-- AddForeignKey
ALTER TABLE "assistant_sessions" ADD CONSTRAINT "assistant_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
