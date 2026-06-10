-- CreateTable
CREATE TABLE "euro_participants" (
    "id" TEXT NOT NULL,
    "pinfl" TEXT NOT NULL,
    "name" TEXT,
    "surname" TEXT,
    "patronymic" TEXT,
    "name_en" TEXT,
    "surname_en" TEXT,
    "birth_date" TIMESTAMP(3),
    "birth_place" TEXT,
    "gender" TEXT,
    "nationality" TEXT,
    "citizenship" TEXT,
    "address" TEXT,
    "passport_seria" TEXT,
    "passport_number" TEXT,
    "myid_raw" JSONB,
    "verified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "euro_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "euro_participants_pinfl_key" ON "euro_participants"("pinfl");
