import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MinioService } from '../files/minio.service';
import { PrismaService } from '../prisma/prisma.service';
import { decryptField, decryptJson, encryptField, encryptJson } from '../common/crypto/field-cipher';
import type { CreateAppointmentDto, DoctorsQueryDto, UpdateMedicalProfileDto } from './dto/health.dto';

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

  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

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

  // ── Мед.карта (M14.9/14.10) — чувствительные поля шифруются ──
  async getMedicalProfile(userId: string) {
    const p = await this.prisma.medicalProfile.findUnique({ where: { userId } });
    return this.serializeMedicalProfile(p);
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
