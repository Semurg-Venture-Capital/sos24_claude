import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CIRCUMSTANCES, renderEuroPdf, type EuroPartyData, type EuroPdfData } from './pdfgen/render';

// Название нашей СК-заказчика (одна компания на старте). TODO: вынести в конфиг/справочник.
const SELF_INSURER = 'SOS24 Sugʻurta';

@Injectable()
export class EuroprotocolPdfService {
  constructor(private readonly prisma: PrismaService) {}

  /** Сгенерировать PDF бланка по id европротокола. */
  async generate(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const meta = await this.prisma.euroProtocol.findUnique({ where: { id }, select: { number: true } });
    if (!meta) throw new NotFoundException('Европротокол не найден');
    const data = await this.buildData(id);
    const buffer = await renderEuroPdf(data);
    return { buffer, filename: `europrotocol-${meta.number}.pdf` };
  }

  /** Собрать данные шаблона из БД (что есть; недостающее — см. docs/europrotocol/FIELD_MAPPING.md). */
  async buildData(id: string): Promise<EuroPdfData> {
    const p = await this.prisma.euroProtocol.findUnique({
      where: { id },
      include: { user: true, vehicle: true, participant: true },
    });
    if (!p) throw new NotFoundException('Европротокол не найден');

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
      ownershipDoc: '',
      insurer: osago ? SELF_INSURER : '',
      policySeria: osagoSeria,
      policyNo: osagoNumber,
      policyValid: fmtDate(osago?.endDate),
      kasko: kasko ? 'yes' : 'no',
      damageDesc: '',
      objections: '',
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
    const { seria: bSeria, number: bNumber } = {
      seria: p.otherPolicySeria || '',
      number: p.otherPolicyNumber || '',
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
      ownerAddr: '', // НАПП адрес владельца не отдаёт → ручной ввод (нет поля)
      driverName: part ? fio(part.surname, part.name, part.patronymic) : '',
      driverBirth: fmtDate(part?.birthDate),
      driverAddr: part?.address || '',
      phone: localPhone(p.otherPhone),
      dlSeria: '', // у participant паспорт, не ВУ → ручной ввод (нет поля)
      dlNo: '',
      dlIssue: '',
      ownershipDoc: '',
      insurer: '', // название СК 2-го → ручной ввод (нет поля)
      policySeria: bSeria,
      policyNo: bNumber,
      policyValid: '', // есть только otherPolicyValid (bool), даты нет
      kasko: '',
      damageDesc: '',
      objections: '',
    };

    return {
      common: {
        place: p.place || '',
        date: fmtDate(p.incidentDate),
        time: (p.incidentTime || '').replace(/\D/g, '').slice(0, 4),
        damagedCount: '2', // европротокол = 2 ТС
        medCheck: '', // нет в модели
        witnesses: '', // нет в модели
        official: '', // нет в модели
        serviceNo: '',
      },
      parties: { a, b },
      // обстоятельства пока не собираются в визарде → все пустые
      circumstances: CIRCUMSTANCES.map((text) => ({ text, a: false, b: false })),
      counts: { a: '', b: '' },
      back: {
        circumstancesText: p.description || '',
        driverRole: '',
        canMove: '',
        cannotMovePlace: '',
        remarks: '',
        signRows: [
          { day: '', month: '', year: '', signature: '', fio: userFio },
          { day: '', month: '', year: '', signature: '', fio: b.driverName },
        ],
      },
    };
  }
}

// "AAA1234567" → seria "AAA" + number "1234567"; если не распознано — всё в number.
function splitPolicy(s?: string | null): { seria: string; number: string } {
  if (!s) return { seria: '', number: '' };
  const m = s.trim().match(/^([A-Za-zА-Яа-я]{2,3})\s*[-]?\s*([0-9]{5,9})$/);
  if (!m) return { seria: '', number: s.trim() };
  return { seria: m[1].toUpperCase(), number: m[2] };
}

// Date → "DDMMYYYY"
function fmtDate(d?: Date | null): string {
  if (!d) return '';
  const dt = new Date(d);
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = String(dt.getUTCFullYear());
  return `${dd}${mm}${yyyy}`;
}

// "+998901234567" → "901234567" (последние 9 цифр для comb-клеток)
function localPhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-9);
}
