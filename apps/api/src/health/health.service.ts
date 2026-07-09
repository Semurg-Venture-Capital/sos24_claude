import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MinioService } from '../files/minio.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SmsService } from '../notifications/sms.service';
import { PrismaService } from '../prisma/prisma.service';
import { decryptField, decryptJson, encryptField, encryptJson } from '../common/crypto/field-cipher';
import { LlmService } from '../llm/llm.service';
import { getTriageProvider, type TriageMessage, type TriageProvider } from './triage/triage.provider';
import type {
  CreateAppointmentDto,
  CreateContactDto,
  DoctorInputDto,
  DoctorsQueryDto,
  SosTriggerDto,
  UpdateContactDto,
  UpdateDoctorDto,
  UpdateMedicalProfileDto,
} from './dto/health.dto';
import type { PartnerBookingStatus } from '@prisma/client';

const MAX_CONTACTS = 3;

const TRIAGE_DISCLAIMER = 'Это не диагноз. ИИ помогает сориентироваться — точный диагноз ставит врач.';

const IMG_TTL = 3600;
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const SLOT_STEP_MIN = 30;

type WorkingHours = Record<string, { open: string; close: string } | null>;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

// Модуль «Здоровье» (M14) · врачи и запись на приём.
// Врач = Doctor (при клинике-Partner); запись = PartnerBooking с doctorId.
@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  // Провайдер триажа: mock или LLM (Gemini через LlmService) — по TRIAGE_MODE.
  private readonly triage: TriageProvider;

  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
    private readonly notifications: NotificationsService,
    private readonly sms: SmsService,
    private readonly llm: LlmService,
  ) {
    this.triage = getTriageProvider(this.llm);
  }

  private async imgUrl(key?: string | null): Promise<string | null> {
    if (!key) return null;
    try {
      return await this.minio.presignedGetUrl(key, IMG_TTL);
    } catch {
      return null;
    }
  }

  // ── Врачи (M14.4) ──
  async listDoctors(query: DoctorsQueryDto) {
    const where: Prisma.DoctorWhereInput = { active: true };
    if (query.specialty) where.specialty = query.specialty;
    if (query.q) {
      where.OR = [
        { fullName: { contains: query.q, mode: 'insensitive' } },
        { specialty: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    const rows = await this.prisma.doctor.findMany({
      where,
      orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
      take: Math.min(query.limit ?? 50, 100),
      include: { partner: { select: { id: true, name: true, city: true } } },
    });

    // Уникальные специальности для фильтр-чипов.
    const specialties = [...new Set(rows.map((r) => r.specialty))];

    const doctors = await Promise.all(rows.map((d) => this.serializeCard(d)));
    return { doctors, specialties };
  }

  private async serializeCard(d: any) {
    return {
      id: d.id,
      fullName: d.fullName,
      specialty: d.specialty,
      experienceY: d.experienceY,
      rating: d.rating,
      reviewCount: d.reviewCount,
      pricePrimary: d.pricePrimary,
      videoEnabled: d.videoEnabled,
      verified: d.verified,
      photoUrl: await this.imgUrl(d.photoKey),
      clinic: d.partner ? { id: d.partner.id, name: d.partner.name, city: d.partner.city } : null,
    };
  }

  // ── Профиль врача (M14.5) ──
  async doctorDetail(id: string) {
    const d = await this.prisma.doctor.findFirst({
      where: { id, active: true },
      include: { partner: { select: { id: true, name: true, city: true, address: true } } },
    });
    if (!d) throw new NotFoundException('Врач не найден');

    const services: { label: string; price: number; accent?: boolean }[] = [];
    if (d.pricePrimary != null) services.push({ label: 'Первичный приём', price: d.pricePrimary });
    if (d.priceRepeat != null) services.push({ label: 'Повторный приём', price: d.priceRepeat });
    if (d.videoEnabled && d.priceVideo != null)
      services.push({ label: 'Видео-консультация', price: d.priceVideo, accent: true });

    return {
      id: d.id,
      fullName: d.fullName,
      specialty: d.specialty,
      experienceY: d.experienceY,
      bio: d.bio,
      rating: d.rating,
      reviewCount: d.reviewCount,
      pricePrimary: d.pricePrimary,
      priceRepeat: d.priceRepeat,
      priceVideo: d.priceVideo,
      videoEnabled: d.videoEnabled,
      verified: d.verified,
      photoUrl: await this.imgUrl(d.photoKey),
      clinic: d.partner,
      services,
    };
  }

  // ── Слоты врача на дату (M14.5/14.6) ──
  async doctorSlots(doctorId: string, date: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { partner: { select: { workingHours: true } } },
    });
    if (!doctor) throw new NotFoundException('Врач не найден');

    const wh = (doctor.workingHours ?? doctor.partner?.workingHours) as WorkingHours | null;
    const day = new Date(`${date}T00:00:00`);
    const dayKey = WEEKDAYS[day.getDay()];
    const hours = wh?.[dayKey];
    if (!hours || !hours.open || !hours.close) return { slots: [] };

    const startMin = toMinutes(hours.open);
    const endMin = toMinutes(hours.close);

    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59`);
    const taken = await this.prisma.partnerBooking.findMany({
      where: { doctorId, scheduledAt: { gte: dayStart, lte: dayEnd }, status: { in: ['PENDING', 'CONFIRMED'] } },
      select: { scheduledAt: true },
    });
    const takenSet = new Set(taken.map((t) => t.scheduledAt.toISOString()));
    const now = new Date();

    const slots: { time: string; iso: string; available: boolean }[] = [];
    for (let m = startMin; m + SLOT_STEP_MIN <= endMin; m += SLOT_STEP_MIN) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const slotDate = new Date(`${date}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`);
      const iso = slotDate.toISOString();
      const isPast = slotDate.getTime() < now.getTime();
      slots.push({
        time: `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
        iso,
        available: !takenSet.has(iso) && !isPast,
      });
    }
    return { slots };
  }

  // ── Создание записи к врачу (M14.6) ──
  async createAppointment(userId: string, dto: CreateAppointmentDto) {
    const doctor = await this.prisma.doctor.findFirst({ where: { id: dto.doctorId, active: true } });
    if (!doctor) throw new NotFoundException('Врач не найден');
    if (!doctor.partnerId)
      throw new BadRequestException('К этому врачу пока нельзя записаться онлайн');

    const scheduledAt = new Date(dto.scheduledAt);
    if (isNaN(scheduledAt.getTime())) throw new BadRequestException('Некорректная дата');
    if (scheduledAt.getTime() < Date.now()) throw new BadRequestException('Нельзя записаться на прошедшее время');

    const clash = await this.prisma.partnerBooking.findFirst({
      where: { doctorId: doctor.id, scheduledAt, status: { in: ['PENDING', 'CONFIRMED'] } },
    });
    if (clash) throw new BadRequestException('Это время уже занято, выберите другое');

    const booking = await this.prisma.partnerBooking.create({
      data: {
        partnerId: doctor.partnerId,
        doctorId: doctor.id,
        userId,
        scheduledAt,
        comment: dto.comment ?? null,
        status: 'PENDING',
      },
      include: { doctor: { select: { fullName: true, specialty: true } }, partner: { select: { name: true } } },
    });
    return this.serializeAppointment(booking);
  }

  async myAppointments(userId: string) {
    const rows = await this.prisma.partnerBooking.findMany({
      where: { userId, doctorId: { not: null } },
      orderBy: { scheduledAt: 'desc' },
      include: { doctor: { select: { fullName: true, specialty: true } }, partner: { select: { name: true } } },
    });
    return { appointments: rows.map((b) => this.serializeAppointment(b)) };
  }

  async cancelAppointment(userId: string, id: string) {
    const b = await this.prisma.partnerBooking.findUnique({ where: { id } });
    if (!b || b.userId !== userId || b.doctorId == null) throw new NotFoundException('Запись не найдена');
    if (b.status === 'COMPLETED') throw new BadRequestException('Завершённую запись нельзя отменить');
    await this.prisma.partnerBooking.update({ where: { id }, data: { status: 'CANCELLED' } });
    return { ok: true };
  }

  private serializeAppointment(b: any) {
    return {
      id: b.id,
      doctorId: b.doctorId,
      doctorName: b.doctor?.fullName,
      specialty: b.doctor?.specialty,
      clinicName: b.partner?.name,
      scheduledAt: b.scheduledAt,
      status: b.status,
      comment: b.comment,
      createdAt: b.createdAt,
    };
  }

  // ══════════ Админка: врачи и записи ══════════
  async adminListDoctors() {
    const rows = await this.prisma.doctor.findMany({
      orderBy: [{ active: 'desc' }, { rating: 'desc' }, { createdAt: 'desc' }],
      include: { partner: { select: { id: true, name: true } }, _count: { select: { bookings: true } } },
    });
    return {
      doctors: rows.map((d) => ({
        id: d.id,
        fullName: d.fullName,
        specialty: d.specialty,
        experienceY: d.experienceY,
        bio: d.bio,
        rating: d.rating,
        reviewCount: d.reviewCount,
        pricePrimary: d.pricePrimary,
        priceRepeat: d.priceRepeat,
        priceVideo: d.priceVideo,
        videoEnabled: d.videoEnabled,
        verified: d.verified,
        active: d.active,
        partnerId: d.partnerId,
        clinicName: d.partner?.name ?? null,
        bookingsCount: d._count.bookings,
        createdAt: d.createdAt,
      })),
    };
  }

  // Клиники для выпадающего списка (медицинские партнёры).
  async adminListClinics() {
    const rows = await this.prisma.partner.findMany({
      where: { type: 'CLINIC' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, city: true },
    });
    return { clinics: rows };
  }

  async adminCreateDoctor(dto: DoctorInputDto) {
    if (dto.partnerId) {
      const p = await this.prisma.partner.findUnique({ where: { id: dto.partnerId } });
      if (!p) throw new BadRequestException('Клиника не найдена');
    }
    return this.prisma.doctor.create({
      data: {
        fullName: dto.fullName,
        specialty: dto.specialty,
        partnerId: dto.partnerId ?? null,
        experienceY: dto.experienceY ?? null,
        bio: dto.bio ?? null,
        pricePrimary: dto.pricePrimary ?? null,
        priceRepeat: dto.priceRepeat ?? null,
        priceVideo: dto.priceVideo ?? null,
        videoEnabled: dto.videoEnabled ?? false,
        verified: dto.verified ?? false,
        active: dto.active ?? true,
      },
    });
  }

  async adminUpdateDoctor(id: string, dto: UpdateDoctorDto) {
    const doc = await this.prisma.doctor.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Врач не найден');
    if (dto.partnerId) {
      const p = await this.prisma.partner.findUnique({ where: { id: dto.partnerId } });
      if (!p) throw new BadRequestException('Клиника не найдена');
    }
    return this.prisma.doctor.update({
      where: { id },
      data: {
        fullName: dto.fullName ?? undefined,
        specialty: dto.specialty ?? undefined,
        partnerId: dto.partnerId === undefined ? undefined : dto.partnerId,
        experienceY: dto.experienceY === undefined ? undefined : dto.experienceY,
        bio: dto.bio === undefined ? undefined : dto.bio,
        pricePrimary: dto.pricePrimary === undefined ? undefined : dto.pricePrimary,
        priceRepeat: dto.priceRepeat === undefined ? undefined : dto.priceRepeat,
        priceVideo: dto.priceVideo === undefined ? undefined : dto.priceVideo,
        videoEnabled: dto.videoEnabled ?? undefined,
        verified: dto.verified ?? undefined,
        active: dto.active ?? undefined,
      },
    });
  }

  async adminDeleteDoctor(id: string) {
    const doc = await this.prisma.doctor.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Врач не найден');
    await this.prisma.doctor.delete({ where: { id } }); // записи получат doctorId=null (onDelete: SetNull)
    return { ok: true };
  }

  async adminListAppointments(status?: PartnerBookingStatus) {
    const rows = await this.prisma.partnerBooking.findMany({
      where: { doctorId: { not: null }, ...(status ? { status } : {}) },
      orderBy: { scheduledAt: 'desc' },
      take: 300,
      include: {
        doctor: { select: { fullName: true, specialty: true } },
        partner: { select: { name: true } },
        user: { select: { name: true, surname: true, phone: true } },
      },
    });
    return {
      appointments: rows.map((b) => ({
        id: b.id,
        doctorName: b.doctor?.fullName ?? null,
        specialty: b.doctor?.specialty ?? null,
        clinicName: b.partner?.name ?? null,
        patientName: [b.user?.name, b.user?.surname].filter(Boolean).join(' ') || 'Клиент',
        patientPhone: b.user?.phone ?? null,
        scheduledAt: b.scheduledAt,
        status: b.status,
        comment: b.comment,
        createdAt: b.createdAt,
      })),
    };
  }

  async adminSetAppointmentStatus(id: string, status: PartnerBookingStatus) {
    const b = await this.prisma.partnerBooking.findUnique({ where: { id } });
    if (!b || b.doctorId == null) throw new NotFoundException('Запись не найдена');
    await this.prisma.partnerBooking.update({ where: { id }, data: { status } });
    return { ok: true, status };
  }

  // ── Админка: SOS-тревоги (диспетчер) ──
  async adminListSosAlerts(status?: 'ACTIVE' | 'CANCELLED' | 'RESOLVED') {
    const rows = await this.prisma.sosAlert.findMany({
      where: status ? { status } : {},
      orderBy: [{ createdAt: 'desc' }],
      take: 200,
      include: {
        user: { select: { name: true, surname: true, phone: true } },
        dispatcher: { select: { name: true, surname: true } },
        notifications: true,
      },
    });
    return {
      alerts: rows.map((a) => ({
        id: a.id,
        patientName: [a.user?.name, a.user?.surname].filter(Boolean).join(' ') || 'Клиент',
        patientPhone: a.user?.phone ?? null,
        lat: a.lat,
        lng: a.lng,
        address: a.address,
        status: a.status,
        notified: a.notified,
        acknowledgedAt: a.acknowledgedAt,
        dispatcherName: a.dispatcher ? [a.dispatcher.name, a.dispatcher.surname].filter(Boolean).join(' ') : null,
        note: a.note,
        contacts: a.notifications.map((n) => ({ name: n.contactName, phone: n.phone, status: n.status })),
        createdAt: a.createdAt,
        cancelledAt: a.cancelledAt,
      })),
    };
  }

  async adminUpdateSosAlert(dispatcherId: string, id: string, action: 'acknowledge' | 'resolve', note?: string) {
    const a = await this.prisma.sosAlert.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Тревога не найдена');
    const data: Prisma.SosAlertUpdateInput = {
      dispatcher: { connect: { id: dispatcherId } },
      acknowledgedAt: a.acknowledgedAt ?? new Date(),
      ...(note !== undefined ? { note } : {}),
    };
    if (action === 'resolve') data.status = 'RESOLVED';
    const updated = await this.prisma.sosAlert.update({ where: { id }, data });
    return { ok: true, status: updated.status };
  }

  // ── Мед.карта (M14.9/14.10) — чувствительные поля шифруются ──
  async getMedicalProfile(userId: string) {
    const [p, user] = await Promise.all([
      this.prisma.medicalProfile.findUnique({ where: { userId } }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, surname: true, patronymic: true, birthDate: true, gender: true },
      }),
    ]);
    return { ...this.serializeMedicalProfile(p), defaults: this.profileDefaults(user) };
  }

  // Автозаполнение из профиля пользователя (MyID): ФИО, дата рождения, пол.
  private profileDefaults(user: { name: string | null; surname: string | null; patronymic: string | null; birthDate: Date | null; gender: string | null } | null) {
    if (!user) return { fullName: null, birthDate: null, gender: null };
    const fullName = [user.name, user.surname, user.patronymic].filter(Boolean).join(' ') || null;
    const birthDate = user.birthDate
      ? `${String(user.birthDate.getUTCDate()).padStart(2, '0')}.${String(user.birthDate.getUTCMonth() + 1).padStart(2, '0')}.${user.birthDate.getUTCFullYear()}`
      : null;
    return { fullName, birthDate, gender: user.gender ?? null };
  }

  async updateMedicalProfile(userId: string, dto: UpdateMedicalProfileDto) {
    const existing = await this.prisma.medicalProfile.findUnique({ where: { userId } });

    // Согласие обязательно при первом сохранении.
    if (!existing?.consentAt && !dto.consent) {
      throw new BadRequestException('Требуется согласие на обработку медицинских данных');
    }

    const data: Prisma.MedicalProfileUncheckedCreateInput = {
      userId,
      fullName: dto.fullName ?? null,
      birthDate: dto.birthDate ?? null,
      gender: dto.gender ?? null,
      bloodType: dto.bloodType ?? null,
      heightCm: dto.heightCm ?? null,
      weightKg: dto.weightKg ?? null,
      allergies: encryptJson(dto.allergies),
      chronic: encryptField(dto.chronic),
      medications: encryptField(dto.medications),
      organDonor: dto.organDonor ?? null,
      pregnancy: dto.pregnancy ?? null,
      dmsPolicy: dto.dmsPolicy ?? null,
      doctorName: dto.doctorName ?? null,
      consentAt: existing?.consentAt ?? new Date(),
    };

    const saved = await this.prisma.medicalProfile.upsert({
      where: { userId },
      create: data,
      update: data,
    });
    return this.serializeMedicalProfile(saved);
  }

  // ── Экстренные контакты (M14.11) ──
  async listContacts(userId: string) {
    const rows = await this.prisma.emergencyContact.findMany({
      where: { userId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return { contacts: rows, limit: MAX_CONTACTS };
  }

  async createContact(userId: string, dto: CreateContactDto) {
    const count = await this.prisma.emergencyContact.count({ where: { userId } });
    if (count >= MAX_CONTACTS) throw new BadRequestException(`Можно добавить не более ${MAX_CONTACTS} контактов`);
    return this.prisma.emergencyContact.create({
      data: { userId, name: dto.name, relation: dto.relation ?? null, phone: dto.phone, sortOrder: count },
    });
  }

  async updateContact(userId: string, id: string, dto: UpdateContactDto) {
    const c = await this.prisma.emergencyContact.findUnique({ where: { id } });
    if (!c || c.userId !== userId) throw new NotFoundException('Контакт не найден');
    return this.prisma.emergencyContact.update({
      where: { id },
      data: { name: dto.name ?? c.name, relation: dto.relation ?? c.relation, phone: dto.phone ?? c.phone },
    });
  }

  async deleteContact(userId: string, id: string) {
    const c = await this.prisma.emergencyContact.findUnique({ where: { id } });
    if (!c || c.userId !== userId) throw new NotFoundException('Контакт не найден');
    await this.prisma.emergencyContact.delete({ where: { id } });
    return { ok: true };
  }

  // ── ЧП / SOS (M14.12) ──
  async triggerSos(userId: string, dto: SosTriggerDto) {
    const [user, contacts] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { name: true, surname: true, phone: true } }),
      this.prisma.emergencyContact.findMany({
        where: { userId },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      }),
    ]);
    const patientName = [user?.name, user?.surname].filter(Boolean).join(' ') || 'Пользователь SOS24';

    const alert = await this.prisma.sosAlert.create({
      data: { userId, lat: dto.lat ?? null, lng: dto.lng ?? null, address: dto.address ?? null, status: 'ACTIVE' },
    });

    // 1) Оповещаем экстренные контакты по SMS (статус — по каждому).
    const locationLine = this.locationLine(dto.lat, dto.lng, dto.address);
    const smsText = `SOS24: ${patientName} запросил(а) экстренную помощь. ${locationLine} Тел.: ${user?.phone ?? '—'}`.trim();

    const notifResults = await Promise.all(
      contacts.map(async (c) => {
        const res = await this.sms.send(c.phone, smsText);
        const notif = await this.prisma.sosNotification.create({
          data: {
            alertId: alert.id,
            contactName: c.name,
            phone: c.phone,
            channel: 'SMS',
            status: res.ok ? 'SENT' : 'FAILED',
            error: res.error ?? null,
            sentAt: res.ok ? new Date() : null,
          },
        });
        return { contact: c, notif };
      }),
    );
    const notifiedCount = notifResults.filter((r) => r.notif.status === 'SENT').length;
    await this.prisma.sosAlert.update({ where: { id: alert.id }, data: { notified: notifiedCount } });

    // 2) Push диспетчерам (роль ADMIN/SUPPORT), чтобы приняли тревогу в админке.
    await this.notifyDispatchers(alert.id, patientName, locationLine);

    this.logger.warn(`SOS ${alert.id} · ${patientName} · оповещено контактов ${notifiedCount}/${contacts.length}`);

    return {
      alert: { id: alert.id, status: alert.status, createdAt: alert.createdAt, lat: alert.lat, lng: alert.lng, address: alert.address },
      contacts: notifResults.map((r) => ({
        id: r.contact.id,
        name: r.contact.name,
        relation: r.contact.relation,
        phone: r.contact.phone,
        sortOrder: r.contact.sortOrder,
        createdAt: r.contact.createdAt,
        notifyStatus: r.notif.status, // SENT | FAILED
      })),
    };
  }

  private locationLine(lat?: number | null, lng?: number | null, address?: string | null): string {
    const parts: string[] = [];
    if (address) parts.push(`Адрес: ${address}.`);
    if (lat != null && lng != null) parts.push(`Гео: https://maps.google.com/?q=${lat},${lng}`);
    return parts.join(' ') || 'Геолокация недоступна.';
  }

  private async notifyDispatchers(alertId: string, patientName: string, locationLine: string) {
    const dispatchers = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPPORT'] } },
      select: { id: true },
    });
    await Promise.all(
      dispatchers.map((d) =>
        this.notifications
          .send(d.id, {
            type: 'SOS_ALERT',
            title: '🚨 SOS-тревога',
            body: `${patientName} вызвал экстренную помощь. ${locationLine}`,
            data: { screen: 'sos', id: alertId },
          })
          .catch(() => undefined),
      ),
    );
  }

  async cancelSos(userId: string, id: string) {
    const a = await this.prisma.sosAlert.findUnique({ where: { id } });
    if (!a || a.userId !== userId) throw new NotFoundException('Тревога не найдена');
    if (a.status !== 'ACTIVE') return { ok: true, status: a.status };
    await this.prisma.sosAlert.update({ where: { id }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
    return { ok: true, status: 'CANCELLED' };
  }

  // ── ИИ-триаж (M14.2/14.3) ──
  private readMessages(session: { messages: string | null }): TriageMessage[] {
    return decryptJson<TriageMessage[]>(session.messages) ?? [];
  }

  async startTriage(userId: string) {
    const intro = await this.triage.intro();
    const messages: TriageMessage[] = [{ role: 'assistant', text: intro.text, at: new Date().toISOString() }];
    const session = await this.prisma.triageSession.create({
      data: { userId, messages: encryptJson(messages), step: 0 },
    });
    return {
      sessionId: session.id,
      messages,
      quickReplies: intro.quickReplies,
      canFinalize: false,
      disclaimer: TRIAGE_DISCLAIMER,
    };
  }

  async triageMessage(userId: string, id: string, text: string) {
    const session = await this.prisma.triageSession.findUnique({ where: { id } });
    if (!session || session.userId !== userId) throw new NotFoundException('Сессия не найдена');

    const messages = this.readMessages(session);
    messages.push({ role: 'user', text, at: new Date().toISOString() });

    const turn = await this.triage.ask(messages, userId);
    messages.push({ role: 'assistant', text: turn.text, at: new Date().toISOString() });

    await this.prisma.triageSession.update({
      where: { id },
      data: { messages: encryptJson(messages), step: session.step + 1 },
    });

    return { messages, quickReplies: turn.quickReplies, canFinalize: turn.canFinalize, disclaimer: TRIAGE_DISCLAIMER };
  }

  async finalizeTriage(userId: string, id: string) {
    const session = await this.prisma.triageSession.findUnique({ where: { id } });
    if (!session || session.userId !== userId) throw new NotFoundException('Сессия не найдена');

    const messages = this.readMessages(session);
    const userTexts = messages.filter((m) => m.role === 'user').map((m) => m.text);
    if (userTexts.length === 0) throw new BadRequestException('Опишите симптомы перед получением результата');

    const v = await this.triage.finalize(messages, userId);
    await this.prisma.triageSession.update({
      where: { id },
      data: {
        symptoms: encryptJson(v.symptoms),
        verdict: encryptField(v.verdict),
        urgency: v.urgency,
        confidence: v.confidence,
      },
    });
    return { ...v, disclaimer: 'Это предварительная оценка ИИ, а не медицинский диагноз. Точный диагноз ставит только врач на очном осмотре.' };
  }

  private serializeMedicalProfile(p: any) {
    if (!p) {
      return { exists: false, consented: false, profile: null };
    }
    return {
      exists: true,
      consented: p.consentAt != null,
      profile: {
        fullName: p.fullName,
        birthDate: p.birthDate,
        gender: p.gender,
        bloodType: p.bloodType,
        heightCm: p.heightCm,
        weightKg: p.weightKg,
        allergies: decryptJson<string[]>(p.allergies) ?? [],
        chronic: decryptField(p.chronic),
        medications: decryptField(p.medications),
        organDonor: p.organDonor,
        pregnancy: p.pregnancy,
        dmsPolicy: p.dmsPolicy,
        doctorName: p.doctorName,
        updatedAt: p.updatedAt,
      },
    };
  }
}
