-- CreateEnum
CREATE TYPE "PricingMode" AS ENUM ('COEFFICIENT', 'PLANS');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProductType" ADD VALUE 'LIFE';
ALTER TYPE "ProductType" ADD VALUE 'TRAVEL';
ALTER TYPE "ProductType" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "policies" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "planId" TEXT,
ADD COLUMN     "productId" TEXT;

-- CreateTable
CREATE TABLE "insurance_companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoKey" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_products" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "ProductType" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT,
    "longDescription" TEXT,
    "pricingMode" "PricingMode" NOT NULL DEFAULT 'PLANS',
    "baseRate" INTEGER,
    "content" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_plans" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "coverageAmount" INTEGER,
    "features" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insurance_companies_slug_key" ON "insurance_companies"("slug");

-- CreateIndex
CREATE INDEX "insurance_products_companyId_active_idx" ON "insurance_products"("companyId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_products_companyId_slug_key" ON "insurance_products"("companyId", "slug");

-- CreateIndex
CREATE INDEX "product_plans_productId_active_idx" ON "product_plans"("productId", "active");

-- CreateIndex
CREATE INDEX "policies_companyId_idx" ON "policies"("companyId");

-- CreateIndex
CREATE INDEX "policies_productId_idx" ON "policies"("productId");

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "insurance_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_productId_fkey" FOREIGN KEY ("productId") REFERENCES "insurance_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_planId_fkey" FOREIGN KEY ("planId") REFERENCES "product_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_products" ADD CONSTRAINT "insurance_products_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "insurance_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_plans" ADD CONSTRAINT "product_plans_productId_fkey" FOREIGN KEY ("productId") REFERENCES "insurance_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
