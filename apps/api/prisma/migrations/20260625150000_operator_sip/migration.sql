-- Колл-центр: персональный SIP-extension оператора.
ALTER TABLE "users" ADD COLUMN "sip_extension" TEXT;
ALTER TABLE "users" ADD COLUMN "sip_secret" TEXT;
