-- CreateTable
CREATE TABLE "medical_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT,
    "birthDate" TEXT,
    "gender" TEXT,
    "bloodType" TEXT,
    "heightCm" INTEGER,
    "weightKg" INTEGER,
    "allergies" TEXT,
    "chronic" TEXT,
    "medications" TEXT,
    "organDonor" BOOLEAN,
    "pregnancy" BOOLEAN,
    "dmsPolicy" TEXT,
    "doctorName" TEXT,
    "consentAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "medical_profiles_userId_key" ON "medical_profiles"("userId");

-- AddForeignKey
ALTER TABLE "medical_profiles" ADD CONSTRAINT "medical_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
