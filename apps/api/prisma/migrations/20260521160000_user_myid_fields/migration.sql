ALTER TABLE "users"
  ADD COLUMN "nameEn"      TEXT,
  ADD COLUMN "surnameEn"   TEXT,
  ADD COLUMN "gender"      TEXT,
  ADD COLUMN "birthPlace"  TEXT,
  ADD COLUMN "nationality" TEXT,
  ADD COLUMN "citizenship" TEXT,
  ADD COLUMN "address"     TEXT,
  ADD COLUMN "myidRaw"     JSONB;
