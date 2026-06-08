import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { NappAuthService } from './napp-auth.service';

// Элемент любого справочника НАПП: { id, name, nameUz, nameUzc }.
export interface NappRefItem {
  id: number | string;
  name: string;
  nameUz?: string;
  nameUzc?: string;
  [k: string]: unknown;
}

// Белый список справочников, которые реально используем при отображении ТС/полиса.
// (Полный список — 44 эндпоинта /api/references/*, см. docs/integrations/NAPP.md.)
export const KNOWN_REFERENCES = [
  'vehicle-types-osago',
  'vehicle-types',
  'genders',
  'regions',
  'districts',
  'countries',
  'use-territory-regions',
  'contract-term-conclusions',
  'insurance-types',
  'ownership-forms',
] as const;
export type KnownReference = (typeof KNOWN_REFERENCES)[number];

interface CacheEntry {
  data: NappRefItem[];
  expiresAt: number;
}

/**
 * Справочники НАПП с in-memory кэшем.
 * Справочники меняются крайне редко → кэшируем на 24 часа.
 * GET /api/references/<name> (Bearer-токен).
 */
@Injectable()
export class NappReferenceService {
  private readonly logger = new Logger(NappReferenceService.name);
  private readonly baseUrl: string;
  private readonly ttlMs = 24 * 60 * 60 * 1000; // 24 часа
  private readonly cache = new Map<string, CacheEntry>();

  constructor(
    private readonly config: ConfigService,
    private readonly auth: NappAuthService,
  ) {
    this.baseUrl = (this.config.get<string>('NAPP_BASE_URL') ?? 'https://sandboxerspapiv2.e-osgo.uz').replace(/\/+$/, '');
  }

  /** Получить справочник по имени (из кэша или НАПП). Пустой массив при ошибке. */
  async get(name: string): Promise<NappRefItem[]> {
    const cached = this.cache.get(name);
    if (cached && Date.now() < cached.expiresAt) return cached.data;

    try {
      const token = await this.auth.getToken();
      const { data } = await axios.get<{ error: number; result: NappRefItem[] }>(
        `${this.baseUrl}/api/references/${name}`,
        {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          timeout: 20_000,
        },
      );
      const items = Array.isArray(data?.result) ? data.result : [];
      this.cache.set(name, { data: items, expiresAt: Date.now() + this.ttlMs });
      return items;
    } catch (e) {
      this.logger.warn(`Справочник ${name} не загружен: ${(e as Error).message}`);
      // отдадим устаревший кэш, если есть
      return cached?.data ?? [];
    }
  }

  /** Найти подпись по id в справочнике (для расшифровки кодов в админке). */
  async label(name: string, id: number | string | null | undefined): Promise<string | null> {
    if (id === null || id === undefined || id === '') return null;
    const items = await this.get(name);
    const found = items.find((x) => String(x.id) === String(id));
    return found?.name ?? null;
  }
}
