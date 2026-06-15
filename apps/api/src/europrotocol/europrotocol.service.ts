import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EuroParticipant, EuroStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MyidService, type MyIdUserData } from '../myid/myid.service';
import { NappService } from '../napp/napp.service';
import type { SubmitEuroDto } from './dto/submit-euro.dto';

// include для детального ответа (участник + авто инициатора).
const EURO_INCLUDE = {
  participant: true,
  vehicle: { select: { id: true, plate: true, brand: true, model: true, year: true } },
} satisfies Prisma.EuroProtocolInclude;

@Injectable()
export class EuroprotocolService {
  private readonly logger = new Logger(EuroprotocolService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly myid: MyidService,
    private readonly napp: NappService,
  ) {}

  // ── Отправка европротокола (сбор данных визарда) ──
  async submit(userId: string, dto: SubmitEuroDto): Promise<{ id: string; number: string }> {
    const number = `EP-26-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
    const created = await this.prisma.euroProtocol.create({
      data: {
        number,
        userId,
        vehicleId: dto.vehicleId ?? null,
        selfVerified: dto.selfVerified ?? false,
        incidentDate: new Date(dto.incidentDate),
        incidentTime: dto.incidentTime,
        place: dto.place,
        lat: dto.lat ?? null,
        lng: dto.lng ?? null,
        participantId: dto.participantId ?? null,
        otherGov: dto.otherGov ?? null,
        otherPhone: dto.otherPhone ?? null,
        otherVehicleRaw: (dto.otherVehicleRaw ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        otherPolicySeria: dto.otherPolicySeria ?? null,
        otherPolicyNumber: dto.otherPolicyNumber ?? null,
        otherPolicyValid: dto.otherPolicyValid ?? null,
        schemeType: dto.schemeType ?? null,
        schemeImageKey: dto.schemeImageKey ?? null,
        description: dto.description ?? null,
        photos: (dto.photos ?? Prisma.JsonNull) as Prisma.InputJsonValue,

        // Общая часть
        medCheck: dto.medCheck ?? null,
        witnesses: dto.witnesses ?? null,
        officialRegistered: dto.officialRegistered ?? null,
        officerBadgeNo: dto.officerBadgeNo ?? null,

        // Обстоятельства
        circumstancesA: (dto.circumstancesA ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        circumstancesB: (dto.circumstancesB ?? Prisma.JsonNull) as Prisma.InputJsonValue,

        // Сторона A — доп.
        ownershipDocA: dto.ownershipDocA ?? null,
        damageDescA: dto.damageDescA ?? null,
        objectionsA: dto.objectionsA ?? null,
        impactZoneA: dto.impactZoneA ?? null,

        // Сторона B — ручной ввод
        otherOwnerAddr: dto.otherOwnerAddr ?? null,
        otherDlSeria: dto.otherDlSeria ?? null,
        otherDlNumber: dto.otherDlNumber ?? null,
        otherDlCategories: dto.otherDlCategories ?? null,
        otherDlIssue: dto.otherDlIssue ? new Date(dto.otherDlIssue) : null,
        otherOwnershipDoc: dto.otherOwnershipDoc ?? null,
        otherInsurer: dto.otherInsurer ?? null,
        otherPolicyValidUntil: dto.otherPolicyValidUntil ? new Date(dto.otherPolicyValidUntil) : null,
        damageDescB: dto.damageDescB ?? null,
        objectionsB: dto.objectionsB ?? null,
        impactZoneB: dto.impactZoneB ?? null,

        // Оборот
        driverRole: dto.driverRole ?? null,
        canMove: dto.canMove ?? null,
        cannotMovePlace: dto.cannotMovePlace ?? null,
        remarks: dto.remarks ?? null,

        // Подпись A — инициатор подтверждён через MyID step-up при submit
        signedAAt: dto.selfVerified ? new Date() : null,
      },
      select: { id: true, number: true },
    });
    return created;
  }

  /**
   * Подпись стороны B по OTP (на otherPhone). SMS-OTP ещё не интегрирован —
   * пока принимаем DEV-код (как и весь auth), фиксируем факт+время подписи.
   * TODO: реальная отправка/проверка OTP на otherPhone (Playmobile).
   */
  async signOther(userId: string, id: string, _code: string): Promise<{ signedAt: Date }> {
    const p = await this.prisma.euroProtocol.findFirst({ where: { id, userId }, select: { id: true } });
    if (!p) throw new NotFoundException('Европротокол не найден');
    const updated = await this.prisma.euroProtocol.update({
      where: { id },
      data: { signedBAt: new Date() },
      select: { signedBAt: true },
    });
    return { signedAt: updated.signedBAt! };
  }

  // ── Список европротоколов пользователя ──
  async listByUser(userId: string) {
    return this.prisma.euroProtocol.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: EURO_INCLUDE,
    });
  }

  // ── Деталь (свой) ──
  async findOneForUser(userId: string, id: string) {
    const p = await this.prisma.euroProtocol.findFirst({ where: { id, userId }, include: EURO_INCLUDE });
    if (!p) throw new NotFoundException('Европротокол не найден');
    return p;
  }

  // ── Админ: список с фильтром по статусу + пагинация ──
  async adminList(status: EuroStatus | undefined, page = 1, limit = 20) {
    const where = status ? { status } : {};
    const [items, total] = await Promise.all([
      this.prisma.euroProtocol.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { ...EURO_INCLUDE, user: { select: { name: true, surname: true, phone: true } } },
      }),
      this.prisma.euroProtocol.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  // ── Админ: деталь ──
  async adminFindOne(id: string) {
    const p = await this.prisma.euroProtocol.findUnique({
      where: { id },
      include: { ...EURO_INCLUDE, user: { select: { name: true, surname: true, phone: true } } },
    });
    if (!p) throw new NotFoundException('Европротокол не найден');
    return p;
  }

  // ── Админ: KPI ──
  async adminStats() {
    const [submitted, review, needInfo, approved, paid, rejected] = await Promise.all([
      this.prisma.euroProtocol.count({ where: { status: 'SUBMITTED' } }),
      this.prisma.euroProtocol.count({ where: { status: 'REVIEW' } }),
      this.prisma.euroProtocol.count({ where: { status: 'NEED_INFO' } }),
      this.prisma.euroProtocol.count({ where: { status: 'APPROVED' } }),
      this.prisma.euroProtocol.count({ where: { status: 'PAID' } }),
      this.prisma.euroProtocol.count({ where: { status: 'REJECTED' } }),
    ]);
    return { submitted, review, needInfo, approved, paid, rejected };
  }

  // ── Админ: смена статуса + примечание ──
  async updateStatus(id: string, status: EuroStatus, adminNote?: string) {
    await this.adminFindOne(id);
    return this.prisma.euroProtocol.update({
      where: { id },
      data: { status, ...(adminNote !== undefined ? { adminNote } : {}) },
      include: { ...EURO_INCLUDE, user: { select: { name: true, surname: true, phone: true } } },
    });
  }

  /**
   * Шаг-ап инициатора: подтверждаем, что физически присутствует владелец аккаунта.
   * MyID-лицо → сверяем ПИНФЛ с аккаунтом. Несовпадение → not ok.
   */
  async stepUp(userId: string, code: string): Promise<{ ok: boolean; pinfl: string }> {
    const profile = await this.myid.fetchProfileByCode(code);
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { pinfl: true } });
    const ok = !!user?.pinfl && user.pinfl === profile.pinfl;
    if (!ok) this.logger.warn(`step-up mismatch: account=${user?.pinfl} myid=${profile.pinfl}`);
    return { ok, pinfl: profile.pinfl };
  }

  /**
   * Верификация второго участника: MyID-профиль → find-or-create EuroParticipant
   * по ПИНФЛ. Возвращает запись участника (без сырого myidRaw).
   */
  async verifyParticipant(code: string): Promise<Omit<EuroParticipant, 'myidRaw'>> {
    const d = await this.myid.fetchProfileByCode(code);
    const { seria, number } = splitPassport(d.passportData);

    const data = {
      name: d.name || null,
      surname: d.surname || null,
      patronymic: d.patronymic || null,
      nameEn: d.nameEn,
      surnameEn: d.surnameEn,
      birthDate: d.birthDate ?? null,
      birthPlace: d.birthPlace,
      gender: d.gender,
      nationality: d.nationality,
      citizenship: d.citizenship,
      address: d.permanentAddress,
      passportSeria: seria,
      passportNumber: number,
      myidRaw: d.raw ? (d.raw as Prisma.InputJsonValue) : Prisma.JsonNull,
    };

    const participant = await this.prisma.euroParticipant.upsert({
      where: { pinfl: d.pinfl },
      create: { pinfl: d.pinfl, ...data },
      update: data,
    });

    const { myidRaw, ...safe } = participant;
    void myidRaw;
    return safe;
  }

  /**
   * Валидация полиса ОСАГО второго участника по серии+номеру через НАПП.
   */
  async validatePolicy(seria: string, number: string): Promise<{ valid: boolean; message: string; result: unknown }> {
    const env = await this.napp.getOsagoPolicyBySeriaNumber(seria, number);
    return {
      valid: env.error === 0 && !!env.result,
      message: env.error_message || '',
      result: env.result ?? null,
    };
  }
}

// "AA4587213" → seria "AA" + number "4587213"
function splitPassport(passportData: string | null | undefined): { seria: string | null; number: string | null } {
  if (!passportData) return { seria: null, number: null };
  const m = passportData.trim().match(/^([A-Za-zА-Яа-я]{2})\s*([0-9]{5,9})$/);
  if (!m) return { seria: null, number: passportData.trim() || null };
  return { seria: m[1].toUpperCase(), number: m[2] };
}
