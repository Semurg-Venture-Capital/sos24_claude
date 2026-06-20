import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MinioService } from '../files/minio.service';

// Рендеры авто через imagin.studio с кэшированием в MinIO.
// Ключ imagin держим на сервере (env IMAGIN_CUSTOMER_KEY); картинку тянем ОДИН раз
// по make/model/year/color, кладём в MinIO и дальше отдаём из своего хранилища
// (presigned). Это снижает обращения к платному API и не светит ключ клиенту.
@Injectable()
export class CarImageService {
  private readonly logger = new Logger(CarImageService.name);
  private readonly customerKey: string;
  private readonly angle = '23'; // 3/4 спереди — самый «карточный» ракурс

  constructor(
    private readonly minio: MinioService,
    private readonly config: ConfigService,
  ) {
    // На dev — публичный demo-ключ imagin; на проде задать боевой лицензионный ключ.
    this.customerKey = this.config.get<string>('IMAGIN_CUSTOMER_KEY') ?? 'hrjavascript-master';
  }

  /**
   * Presigned-URL рендера авто (из кэша MinIO; при промахе — тянем из imagin и кэшируем).
   * Возвращает null, если рендер получить не удалось (мобайл покажет фолбэк).
   */
  async getRenderUrl(make: string, model: string, year?: number | null, color?: string | null): Promise<string | null> {
    if (!make?.trim() || !model?.trim()) return null;
    const paint = mapColor(color);
    const key = `cars/render/${slug(`${make}-${model}-${year ?? 'any'}-${paint ?? 'def'}-${this.angle}`)}.png`;

    try {
      if (!(await this.minio.exists(key))) {
        const buf = await this.fetchFromImagin(make, model, year, paint);
        if (!buf) return null;
        await this.minio.put(buf, 'image/png', key);
      }
      return await this.minio.presignedGetUrl(key, 3600);
    } catch (e) {
      this.logger.warn(`Рендер авто не получен (${make} ${model}): ${(e as Error).message}`);
      return null;
    }
  }

  private async fetchFromImagin(make: string, model: string, year?: number | null, paint?: string | null): Promise<Buffer | null> {
    const params = new URLSearchParams({
      customer: this.customerKey,
      make: make.trim().toLowerCase(),
      modelFamily: model.trim().toLowerCase(),
      angle: this.angle,
      zoomType: 'fullscreen',
      fileType: 'png',
      width: '600',
    });
    if (year) params.set('modelYear', String(year));
    if (paint) params.set('paintDescription', paint);

    const url = `https://cdn.imagin.studio/getimage?${params.toString()}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      this.logger.warn(`imagin ${res.status} для ${make} ${model}`);
      return null;
    }
    // imagin при ошибке/недоступной модели отдаёт картинку-заглушку («авто под чехлом»)
    // с заголовком x-imaginstudio-error (напр. "Customer account is disabled" для
    // отключённого ключа). В этом случае рендер НЕ используем — пусть будет фолбэк.
    const imaginError = res.headers.get('x-imaginstudio-error');
    if (imaginError) {
      this.logger.warn(`imagin не отдал рендер (${make} ${model}): ${imaginError}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 2000) return null;
    return buf;
  }
}

// Слаг для имени объекта: латиница/цифры, остальное → дефис.
function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Цвет авто (рус.) → generic paintDescription imagin (англ.). Неизвестный → null (дефолт).
function mapColor(color?: string | null): string | null {
  if (!color) return null;
  const c = color.trim().toLowerCase();
  const map: Array<[RegExp, string]> = [
    [/бел|white/, 'white'],
    [/чёрн|черн|black/, 'black'],
    [/сереб|silver/, 'silver'],
    [/граф|сер[ыоа]|grey|gray/, 'grey'],
    [/син|голуб|blue/, 'blue'],
    [/красн|red/, 'red'],
    [/зел|green/, 'green'],
    [/желт|yellow/, 'yellow'],
    [/корич|brown/, 'brown'],
    [/беж|beige/, 'beige'],
    [/оранж|orange/, 'orange'],
  ];
  for (const [re, en] of map) if (re.test(c)) return en;
  return null;
}
