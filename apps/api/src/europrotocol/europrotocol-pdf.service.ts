import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../files/minio.service';
import { CIRCUMSTANCES, renderEuroPdf, type EuroPartyData, type EuroPdfData } from './pdfgen/render';

// Название нашей СК-заказчика (одна компания на старте). TODO: вынести в конфиг/справочник.
const SELF_INSURER = 'SOS24 Sugʻurta';

// Коды зон первого удара → подпись на бланке (узб.).
const ZONE_LABEL: Record<string, string> = {
  front: 'олд',
  rear: 'орқа',
  left: 'чап',
  right: 'ўнг',
  'front-left': 'олд-чап',
  'front-right': 'олд-ўнг',
  'rear-left': 'орқа-чап',
  'rear-right': 'орқа-ўнг',
};
function zoneLabel(code?: string | null): string {
  if (!code) return '';
  return ZONE_LABEL[code] ?? code;
}

@Injectable()
export class EuroprotocolPdfService {
  private readonly logger = new Logger(EuroprotocolPdfService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  /** Сгенерировать PDF бланка по id европротокола. */
  async generate(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const meta = await this.prisma.euroProtocol.findUnique({ where: { id }, select: { number: true } });
    if (!meta) throw new NotFoundException('Европротокол не найден');
    const data = await this.buildData(id);
    const buffer = await renderEuroPdf(data);
    return { buffer, filename: `europrotocol-${meta.number}.pdf` };
  }

  /** Собрать данные шаблона из БД. Недостающее без значения — пусто (см. FIELD_MAPPING.md). */
  async buildData(id: string): Promise<EuroPdfData> {
    const p = await this.prisma.euroProtocol.findUnique({
      where: { id },
      include: { user: true, vehicle: true, participant: true },
    });
    if (!p) throw new NotFoundException('Европротокол не найден');

    // Публичный токен для QR (создаём лениво, если ещё нет) + ссылка проверки.
    let token = p.publicToken;
    if (!token) {
      token = randomBytes(12).toString('base64url');
      await this.prisma.euroProtocol.update({ where: { id }, data: { publicToken: token } });
    }
    const base = process.env.PUBLIC_BASE_URL ?? 'https://api.sos24.uz';
    const qrUrl = `${base}/p/${token}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 1, width: 220 });

    // ВУ и полисы инициатора (сторона A)
    const dl = await this.prisma.document.findUnique({
      where: { userId_kind: { userId: p.userId, kind: 'DRIVER_LICENSE' } },
    });
    const osago = p.vehicleId
      ? await this.prisma.policy.findFirst({
          where: { userId: p.userId, vehicleId: p.vehicleId, type: 'OSAGO' },
          orderBy: { createdAt: 'desc' },
        })
      : null;
    const kasko = p.vehicleId
      ? await this.prisma.policy.findFirst({
          where: { userId: p.userId, vehicleId: p.vehicleId, type: 'KASKO', status: 'ACTIVE' },
        })
      : null;

    const fio = (s?: string | null, n?: string | null, pt?: string | null) =>
      [s, n, pt].filter(Boolean).join(' ').trim();

    // ── Сторона A (инициатор) ──
    const v = p.vehicle;
    const u = p.user;
    const userFio = fio(u.surname, u.name, u.patronymic);
    const { seria: osagoSeria, number: osagoNumber } = splitPolicy(osago?.policyNumber);

    const a: EuroPartyData = {
      side: 'А',
      makeModel: v ? [v.brand, v.model].filter(Boolean).join(' ') + (v.year ? `, ${v.year}` : '') : '',
      bodyNo: v?.bodyNumber || v?.vin || '',
      engineNo: v?.engineNumber || '',
      regStateNo: v?.plate || '',
      regCertSeria: v?.techPassportSeria || '',
      regCertNo: v?.techPassportNumber || '',
      ownerName: v?.ownerName || userFio,
      ownerAddr: u.address || '',
      driverName: userFio,
      driverBirth: fmtDate(u.birthDate),
      driverAddr: u.address || '',
      phone: localPhone(u.phone),
      dlSeria: dl?.series || '',
      dlNo: dl?.number || '',
      dlIssue: fmtDate(dl?.issuedAt),
      ownershipDoc: p.ownershipDocA || '',
      insurer: osago ? SELF_INSURER : '',
      policySeria: osagoSeria,
      policyNo: osagoNumber,
      policyValid: fmtDate(osago?.endDate),
      kasko: kasko ? 'yes' : 'no',
      damageDesc: p.damageDescA || '',
      objections: p.objectionsA || '',
      impactZone: zoneLabel(p.impactZoneA),
      signStamp: signStamp(p.signedAAt, 'MyID'),
    };

    // ── Сторона B (второй участник) ──
    const part = p.participant;
    const raw = (p.otherVehicleRaw ?? {}) as Record<string, unknown>;
    const str = (...keys: string[]): string => {
      for (const k of keys) {
        const val = raw[k];
        if (typeof val === 'string' && val) return val;
        if (typeof val === 'number') return String(val);
      }
      return '';
    };

    const b: EuroPartyData = {
      side: 'В',
      // из НАПП TechPassportInfo (otherVehicleRaw) — best-effort по вероятным ключам
      makeModel: [str('markName', 'mark', 'brand'), str('modelName', 'model')].filter(Boolean).join(' '),
      bodyNo: str('bodyNumber', 'body', 'vin'),
      engineNo: str('engineNumber', 'engine'),
      regStateNo: p.otherGov || '',
      regCertSeria: str('techPassportSeria', 'techSeria'),
      regCertNo: str('techPassportNumber', 'techNumber'),
      ownerName: str('ownerName', 'owner'),
      ownerAddr: p.otherOwnerAddr || '',
      driverName: part ? fio(part.surname, part.name, part.patronymic) : '',
      driverBirth: fmtDate(part?.birthDate),
      driverAddr: part?.address || '',
      phone: localPhone(p.otherPhone),
      dlSeria: p.otherDlSeria || '',
      dlNo: p.otherDlNumber || '',
      dlIssue: fmtDate(p.otherDlIssue),
      ownershipDoc: p.otherOwnershipDoc || '',
      insurer: p.otherInsurer || '',
      policySeria: p.otherPolicySeria || '',
      policyNo: p.otherPolicyNumber || '',
      policyValid: fmtDate(p.otherPolicyValidUntil),
      kasko: '',
      damageDesc: p.damageDescB || '',
      objections: p.objectionsB || '',
      impactZone: zoneLabel(p.impactZoneB),
      signStamp: signStamp(p.signedBAt, 'OTP'),
    };

    // ── Обстоятельства (22 boolean на сторону) ──
    const circA = toBoolArray(p.circumstancesA);
    const circB = toBoolArray(p.circumstancesB);
    const circumstances = CIRCUMSTANCES.map((text, i) => ({ text, a: !!circA[i], b: !!circB[i] }));
    const countA = circA.filter(Boolean).length;
    const countB = circB.filter(Boolean).length;

    // ── Схема ДТП: встраиваем картинку из MinIO как data-URI ──
    const schemeImg = await this.embedImage(p.schemeImageKey);

    return {
      common: {
        place: p.place || '',
        date: fmtDate(p.incidentDate),
        time: (p.incidentTime || '').replace(/\D/g, '').slice(0, 4),
        damagedCount: '2', // европротокол = 2 ТС
        medCheck: ynOpt(p.medCheck),
        witnesses: p.witnesses || '',
        official: ynOpt(p.officialRegistered),
        serviceNo: p.officerBadgeNo || '',
      },
      parties: { a, b },
      circumstances,
      counts: { a: countA ? String(countA) : '', b: countB ? String(countB) : '' },
      schemeImg,
      qrUrl,
      qrDataUrl,
      signA: signStamp(p.signedAAt, 'MyID'),
      signB: signStamp(p.signedBAt, 'OTP'),
      back: {
        circumstancesText: p.description || '',
        driverRole: (p.driverRole as 'owner' | 'other' | null) || '',
        canMove: ynOpt(p.canMove),
        cannotMovePlace: p.cannotMovePlace || '',
        remarks: p.remarks || '',
        signRows: [
          { ...dateParts(p.signedAAt), signature: signStamp(p.signedAAt, 'MyID'), fio: userFio },
          { ...dateParts(p.signedBAt), signature: signStamp(p.signedBAt, 'OTP'), fio: b.driverName },
        ],
      },
    };
  }

  /** Скачать картинку из MinIO и вернуть data-URI (или undefined). */
  private async embedImage(key?: string | null): Promise<string | undefined> {
    if (!key) return undefined;
    try {
      const buf = await this.minio.get(key);
      const mime = key.endsWith('.jpg') || key.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
      return `data:${mime};base64,${buf.toString('base64')}`;
    } catch (e) {
      this.logger.warn(`Не удалось загрузить схему ${key}: ${(e as Error).message}`);
      return undefined;
    }
  }
}

// "AAA1234567" → seria "AAA" + number "1234567"; если не распознано — всё в number.
function splitPolicy(s?: string | null): { seria: string; number: string } {
  if (!s) return { seria: '', number: '' };
  const m = s.trim().match(/^([A-Za-zА-Яа-я]{2,3})\s*[-]?\s*([0-9]{5,9})$/);
  if (!m) return { seria: '', number: s.trim() };
  return { seria: m[1].toUpperCase(), number: m[2] };
}

// Date → "DDMMYYYY" (для comb-полей бланка)
function fmtDate(d?: Date | null): string {
  if (!d) return '';
  const dt = new Date(d);
  return `${pad(dt.getUTCDate())}${pad(dt.getUTCMonth() + 1)}${dt.getUTCFullYear()}`;
}

// Date → { day, month, year(2 цифры) } для строк подписей оборота
function dateParts(d?: Date | null): { day: string; month: string; year: string } {
  if (!d) return { day: '', month: '', year: '' };
  const dt = new Date(d);
  return { day: pad(dt.getUTCDate()), month: pad(dt.getUTCMonth() + 1), year: String(dt.getUTCFullYear()).slice(-2) };
}

// Штамп подписи: "Имзоланган (OTP) 15.06.2026"
function signStamp(d?: Date | null, method = 'OTP'): string {
  if (!d) return '';
  const dt = new Date(d);
  return `Имзоланган (${method}) ${pad(dt.getUTCDate())}.${pad(dt.getUTCMonth() + 1)}.${dt.getUTCFullYear()}`;
}

function ynOpt(b?: boolean | null): 'yes' | 'no' | '' {
  return b === true ? 'yes' : b === false ? 'no' : '';
}

function toBoolArray(j: unknown): boolean[] {
  return Array.isArray(j) ? j.map((x) => !!x) : [];
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// "+998901234567" → "901234567" (последние 9 цифр для comb-клеток)
function localPhone(phone?: string | null): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(-9);
}
