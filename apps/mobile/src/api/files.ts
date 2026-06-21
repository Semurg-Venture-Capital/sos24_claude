import { api } from './client';

// Безопасная загрузка файлов в MinIO через presigned POST-policy.
// Поток: наш API (JWT) выдаёт временную политику → файл идёт НАПРЯМУЮ в S3 (s3.sos24.uz),
// минуя наш сервер. Креды MinIO клиенту не передаются; политика ограничивает тип/размер/ключ.

export interface UploadedMedia {
  key: string;
  contentType: string;
}

type FileKind = 'image' | 'video' | 'pdf' | 'doc';

interface PresignUploadResp {
  url: string;
  fields: Record<string, string>;
  key: string;
  contentType: string;
  maxBytes: number;
}

// Content-type по расширению URI (камера iOS: .jpg / .mov).
function inferContentType(uri: string, kind: FileKind): string {
  const ext = (uri.split('?')[0].split('.').pop() || '').toLowerCase();
  if (kind === 'video') {
    return ext === 'mp4' ? 'video/mp4' : ext === 'webm' ? 'video/webm' : 'video/quicktime';
  }
  if (kind === 'pdf') return 'application/pdf';
  return ext === 'png'
    ? 'image/png'
    : ext === 'webp'
      ? 'image/webp'
      : ext === 'heic'
        ? 'image/heic'
        : 'image/jpeg';
}

/**
 * Заливает локальный файл (uri) в MinIO. Сначала пробует безопасный presigned POST напрямую
 * в S3 (s3.sos24.uz); если эндпоинт/хранилище ещё не подняты — откатывается на загрузку
 * через наш API (/files/upload). Возвращает ключ объекта.
 */
export async function uploadFileToS3(uri: string, kind: FileKind): Promise<UploadedMedia> {
  // Картинки приводим к JPEG: iPhone снимает в HEIC, который не показывают
  // браузеры (админка) и Android. JPEG понимают везде.
  let finalUri = uri;
  let contentType = inferContentType(uri, kind);
  if (kind === 'image') {
    try {
      const IM = await import('expo-image-manipulator');
      const out = await IM.manipulateAsync(uri, [], { compress: 0.8, format: IM.SaveFormat.JPEG });
      finalUri = out.uri;
      contentType = 'image/jpeg';
    } catch {
      // Если модуль недоступен (старый билд) — грузим как есть.
    }
  }
  try {
    return await uploadViaPresign(finalUri, kind, contentType);
  } catch {
    // Fallback: пока s3.sos24.uz / presign-upload не задеплоены — грузим через API.
    return await uploadViaApi(finalUri, contentType);
  }
}

// Прямая безопасная загрузка в S3 по presigned POST-policy.
async function uploadViaPresign(uri: string, kind: FileKind, contentType: string): Promise<UploadedMedia> {
  // 1) Политика от нашего API (под JWT).
  const { data } = await api.post<PresignUploadResp>('/files/presign-upload', { kind, contentType });

  // 2) Multipart POST НАПРЯМУЮ в S3: сначала поля политики, файл — последним (требование S3 POST).
  const form = new FormData();
  Object.entries(data.fields).forEach(([k, v]) => form.append(k, String(v)));
  const name = data.key.split('/').pop() || `media.${kind === 'video' ? 'mov' : 'jpg'}`;
  form.append('file', { uri, name, type: contentType } as unknown as Blob);

  // 3) Прямой POST в S3 — без Authorization/baseURL (это не наш API). MinIO отвечает 204.
  const res = await fetch(data.url, { method: 'POST', body: form });
  if (!(res.ok || res.status === 204)) {
    throw new Error(`S3 upload failed: ${res.status}`);
  }
  return { key: data.key, contentType };
}

// Загрузка через наш API (multipart → /files/upload). Совместимость, пока s3 не поднят.
async function uploadViaApi(uri: string, contentType: string): Promise<UploadedMedia> {
  const ext = (uri.split('?')[0].split('.').pop() || '').toLowerCase();
  const name = `media.${ext || (contentType.startsWith('video/') ? 'mov' : 'jpg')}`;
  const form = new FormData();
  form.append('file', { uri, name, type: contentType } as unknown as Blob);
  const { data } = await api.post<{ key: string; contentType: string }>('/files/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return { key: data.key, contentType: data.contentType ?? contentType };
}

/** Временная ссылка на скачивание объекта (presigned GET, TTL ~5 мин). */
export async function getDownloadUrl(key: string): Promise<string> {
  const { data } = await api.get<{ url: string }>('/files/presign-download', { params: { key } });
  return data.url;
}
