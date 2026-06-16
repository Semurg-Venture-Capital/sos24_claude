-- Публичный токен для QR-проверки европротокола
ALTER TABLE "euro_protocols" ADD COLUMN "public_token" TEXT;
CREATE UNIQUE INDEX "euro_protocols_public_token_key" ON "euro_protocols"("public_token");
