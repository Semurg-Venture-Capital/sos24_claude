import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Logger } from '@nestjs/common';

// Field-level шифрование чувствительных мед-полей (M14): AES-256-GCM.
// Формат шифротекста: v1:<iv_b64>:<tag_b64>:<data_b64>. В БД хранится только он.
// Ключ — MED_ENCRYPTION_KEY (base64, 32 байта). В dev при отсутствии ключа
// используется детерминированный fallback (с предупреждением) — чтобы модуль
// работал без настройки; в проде ключ ОБЯЗАТЕЛЕН (из Vault).

const logger = new Logger('FieldCipher');
const VERSION = 'v1';

let cachedKey: Buffer | null = null;

function loadKey(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = process.env.MED_ENCRYPTION_KEY;
  if (raw) {
    const buf = Buffer.from(raw, 'base64');
    if (buf.length !== 32) {
      throw new Error('MED_ENCRYPTION_KEY должен быть 32 байта (base64). Сейчас: ' + buf.length);
    }
    cachedKey = buf;
    return buf;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('MED_ENCRYPTION_KEY не задан — обязателен в production');
  }
  logger.warn('MED_ENCRYPTION_KEY не задан — использую dev-fallback (небезопасно, только для разработки)');
  cachedKey = Buffer.alloc(32, 'sos24-dev-medical-fallback-key!!'.slice(0, 32));
  return cachedKey;
}

// Шифрует строку. null/undefined/'' → null (пустое поле не шифруем).
export function encryptField(plain: string | null | undefined): string | null {
  if (plain == null || plain === '') return null;
  const key = loadKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

// Расшифровывает строку формата v1:iv:tag:data. null → null.
// Если формат не распознан (напр. legacy-незашифрованное значение) — вернём как есть.
export function decryptField(stored: string | null | undefined): string | null {
  if (stored == null || stored === '') return null;
  const parts = stored.split(':');
  if (parts.length !== 4 || parts[0] !== VERSION) return stored;
  try {
    const key = loadKey();
    const [, ivB64, tagB64, dataB64] = parts;
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const dec = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
    return dec.toString('utf8');
  } catch (e) {
    logger.error('Не удалось расшифровать мед-поле (ключ сменился или данные повреждены)');
    return null;
  }
}

// Хелперы для JSON-массивов (аллергии и т.п.): шифруем как JSON-строку.
export function encryptJson(value: unknown): string | null {
  if (value == null) return null;
  if (Array.isArray(value) && value.length === 0) return null;
  return encryptField(JSON.stringify(value));
}

export function decryptJson<T = unknown>(stored: string | null | undefined): T | null {
  const raw = decryptField(stored);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
