-- Публичный токен полиса для страницы проверки /v/<token>
ALTER TABLE "policies" ADD COLUMN "public_token" TEXT;
CREATE UNIQUE INDEX "policies_public_token_key" ON "policies"("public_token");
