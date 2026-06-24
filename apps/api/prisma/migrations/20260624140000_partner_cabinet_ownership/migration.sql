-- B2B-кабинет партнёров: роль PARTNER + владелец-аккаунт у страховой компании и точки-партнёра (1:1).

-- 1) Новое значение роли
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PARTNER';

-- 2) Владелец страховой компании
ALTER TABLE "insurance_companies" ADD COLUMN "owner_id" TEXT;
CREATE UNIQUE INDEX "insurance_companies_owner_id_key" ON "insurance_companies"("owner_id");
ALTER TABLE "insurance_companies"
  ADD CONSTRAINT "insurance_companies_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 3) Владелец точки-партнёра
ALTER TABLE "partners" ADD COLUMN "owner_id" TEXT;
CREATE UNIQUE INDEX "partners_owner_id_key" ON "partners"("owner_id");
ALTER TABLE "partners"
  ADD CONSTRAINT "partners_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
