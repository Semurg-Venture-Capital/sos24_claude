// Общие типы API — отражают Prisma enum'ы с бэка.
// Позже мигрируем в @sos24/api-types через автогенерацию OpenAPI.

export type ProductType = 'OSAGO' | 'KASKO' | 'HEALTH' | 'HOME' | 'FINANCE';
export type PolicyStatus = 'DRAFT' | 'PENDING_PAYMENT' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
export type DriverLimit = 'LIMITED' | 'UNLIMITED';
export type DocumentKind = 'PASSPORT' | 'DRIVER_LICENSE';
export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type CardBrandApi = 'UZCARD' | 'HUMO' | 'VISA' | 'MASTERCARD';
export type PaymentMethod = 'WALLET' | 'CARD' | 'PAYME' | 'CLICK';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type WalletTxType = 'TOPUP' | 'PAYMENT' | 'REFUND' | 'BONUS';
