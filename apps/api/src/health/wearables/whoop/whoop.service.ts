import { createHmac, timingSafeEqual } from 'node:crypto';
import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { decryptField, encryptField } from '../../../common/crypto/field-cipher';
import { effectiveWhoopMode, WHOOP_CLIENT_SECRET, WHOOP_SUCCESS_DEEPLINK, WHOOP_SYNC_QUEUE } from './whoop.config';
import { getWhoopProvider, WhoopProvider, WhoopTokens } from './whoop.provider';

export interface WhoopSyncJob {
  userId: string;
}

export interface WhoopWebhookEvent {
  user_id?: number | string;
  id?: string | number;
  type?: string;
  trace_id?: string;
}

// Оркестратор WHOOP (Фаза 1): подключение (OAuth), хранение зашифрованных токенов с авто-refresh,
// синхронизация метрик в WhoopSnapshot, статус для приложения, отключение. Провайдер — mock/real.
@Injectable()
export class WhoopService {
  private readonly logger = new Logger(WhoopService.name);
  private get provider(): WhoopProvider {
    return getWhoopProvider();
  }

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(WHOOP_SYNC_QUEUE) private readonly syncQueue: Queue<WhoopSyncJob>,
  ) {}

  // ── Вебхуки WHOOP ──
  // Проверка HMAC-подписи: base64(HMAC-SHA256(timestamp + raw_body, client_secret)).
  // Без заданного секрета (dev/mock) — пропускаем с предупреждением.
  verifySignature(rawBody: Buffer, signature?: string, timestamp?: string): boolean {
    if (!WHOOP_CLIENT_SECRET) {
      this.logger.warn('WHOOP webhook: WHOOP_CLIENT_SECRET не задан — проверка подписи пропущена (dev)');
      return true;
    }
    if (!signature || !timestamp) return false;
    const computed = createHmac('sha256', WHOOP_CLIENT_SECRET)
      .update(timestamp + rawBody.toString('utf8'))
      .digest('base64');
    try {
      return timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  // Обрабатывает событие: находит подключение по whoop user_id и ставит задачу синхронизации.
  async handleWebhook(evt: WhoopWebhookEvent): Promise<{ queued: boolean }> {
    const whoopUserId = evt?.user_id != null ? String(evt.user_id) : null;
    if (!whoopUserId) return { queued: false };
    const conn = await this.prisma.wearableConnection.findFirst({
      where: { provider: 'WHOOP', status: 'CONNECTED', providerUserId: whoopUserId },
    });
    if (!conn) {
      this.logger.warn(`WHOOP webhook ${evt.type}: нет подключения для user_id=${whoopUserId}`);
      return { queued: false };
    }
    // Дедупликация: один активный job на пользователя (обновляем задержку/данные).
    await this.syncQueue.add(
      'sync',
      { userId: conn.userId },
      { jobId: `whoop-sync-${conn.userId}`, removeOnComplete: true, removeOnFail: 100 },
    );
    this.logger.log(`WHOOP webhook ${evt.type} → задача синхронизации для user=${conn.userId}`);
    return { queued: true };
  }

  // ── OAuth: старт подключения ──
  // real: возвращаем OAuth-ссылку для браузера (обмен кода придёт в callback).
  // mock: подключаем сразу (dev-удобство — без браузера и нативных OAuth-библиотек),
  //       возвращаем уже готовый статус с метриками.
  async startConnect(userId: string): Promise<{ mode: 'mock' | 'real'; authorizeUrl?: string } & Record<string, unknown>> {
    if (effectiveWhoopMode() === 'real') {
      const state = encryptField(JSON.stringify({ userId, t: Date.now() }));
      if (!state) throw new BadRequestException('Не удалось подготовить подключение');
      return { mode: 'real', authorizeUrl: this.provider.buildAuthorizeUrl(state) };
    }
    const tokens = await this.provider.exchangeCode('MOCK');
    await this.saveTokens(userId, tokens);
    await this.sync(userId).catch((e) => this.logger.warn(`mock connect sync failed: ${e?.message}`));
    await this.backfill(userId).catch((e) => this.logger.warn(`mock backfill failed: ${e?.message}`));
    // getStatus уже содержит mode ('mock') + connected + metrics.
    return this.getStatus(userId);
  }

  // ── OAuth: возврат из браузера ──
  // Возвращает deeplink для редиректа обратно в приложение.
  async handleCallback(code?: string, state?: string, error?: string): Promise<string> {
    if (error) return `${WHOOP_SUCCESS_DEEPLINK}?status=error`;
    const userId = this.decodeState(state);
    if (!userId || !code) return `${WHOOP_SUCCESS_DEEPLINK}?status=error`;
    try {
      const tokens = await this.provider.exchangeCode(code);
      const conn = await this.saveTokens(userId, tokens);
      await this.sync(userId).catch((e) => this.logger.warn(`initial sync failed: ${e?.message}`));
      // Бэкфилл истории (30 дней) — в фоне через очередь, чтобы не тормозить редирект.
      await this.syncQueue.add(
        'backfill',
        { userId },
        { jobId: `whoop-backfill-${userId}`, removeOnComplete: true, removeOnFail: 100 },
      );
      this.logger.log(`WHOOP подключён для user=${userId} (conn=${conn.id})`);
      return `${WHOOP_SUCCESS_DEEPLINK}?status=connected`;
    } catch (e: any) {
      this.logger.error(`WHOOP callback error: ${e?.message}`);
      return `${WHOOP_SUCCESS_DEEPLINK}?status=error`;
    }
  }

  private decodeState(state?: string): string | null {
    if (!state) return null;
    try {
      const raw = decryptField(state);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { userId?: string; t?: number };
      // маркер живёт 15 минут
      if (!parsed.userId || !parsed.t || Date.now() - parsed.t > 15 * 60 * 1000) return null;
      return parsed.userId;
    } catch {
      return null;
    }
  }

  private async saveTokens(userId: string, tokens: WhoopTokens) {
    const expiresAt = new Date(Date.now() + tokens.expiresInSec * 1000);
    const data = {
      status: 'CONNECTED' as const,
      providerUserId: tokens.providerUserId,
      accessToken: encryptField(tokens.accessToken),
      refreshToken: encryptField(tokens.refreshToken),
      scope: tokens.scope,
      expiresAt,
    };
    return this.prisma.wearableConnection.upsert({
      where: { userId_provider: { userId, provider: 'WHOOP' } },
      create: { userId, provider: 'WHOOP', ...data },
      update: data,
    });
  }

  // Возвращает валидный access-token, обновляя его при необходимости.
  private async ensureAccessToken(conn: { id: string; refreshToken: string | null; accessToken: string | null; expiresAt: Date | null }): Promise<string> {
    const soon = Date.now() + 60_000; // обновляем за минуту до истечения
    if (conn.accessToken && conn.expiresAt && conn.expiresAt.getTime() > soon) {
      const dec = decryptField(conn.accessToken);
      if (dec) return dec;
    }
    const refresh = decryptField(conn.refreshToken);
    if (!refresh) throw new BadRequestException('Нет refresh-token — переподключите WHOOP');
    const tokens = await this.provider.refresh(refresh);
    const expiresAt = new Date(Date.now() + tokens.expiresInSec * 1000);
    await this.prisma.wearableConnection.update({
      where: { id: conn.id },
      data: {
        accessToken: encryptField(tokens.accessToken),
        refreshToken: encryptField(tokens.refreshToken ?? refresh),
        expiresAt,
      },
    });
    return tokens.accessToken;
  }

  // ── Синхронизация метрик ──
  async sync(userId: string) {
    const conn = await this.prisma.wearableConnection.findUnique({
      where: { userId_provider: { userId, provider: 'WHOOP' } },
    });
    if (!conn || conn.status !== 'CONNECTED') throw new BadRequestException('WHOOP не подключён');

    const access = await this.ensureAccessToken(conn);
    const [rec, sleep, cycle, workouts, body] = await Promise.all([
      this.provider.fetchRecovery(access),
      this.provider.fetchSleep(access),
      this.provider.fetchCycle(access),
      this.provider.fetchWorkouts(access),
      this.provider.fetchBody(access),
    ]);

    const snap = {
      userId,
      recoveryScore: rec?.recoveryScore ?? null,
      hrvMs: rec?.hrvMs ?? null,
      restingHr: rec?.restingHr ?? null,
      spo2: rec?.spo2 ?? null,
      skinTempC: rec?.skinTempC ?? null,
      recoveryAt: rec?.at ?? null,
      sleepPerformance: sleep?.performance ?? null,
      sleepTotalMinutes: sleep?.totalMin ?? null,
      sleepLightMin: sleep?.lightMin ?? null,
      sleepDeepMin: sleep?.deepMin ?? null,
      sleepRemMin: sleep?.remMin ?? null,
      sleepAwakeMin: sleep?.awakeMin ?? null,
      respiratoryRate: sleep?.respiratoryRate ?? null,
      sleepNeedMin: sleep?.needMin ?? null,
      sleepConsistency: sleep?.consistencyPct ?? null,
      sleepEfficiency: sleep?.efficiencyPct ?? null,
      sleepAt: sleep?.at ?? null,
      dayStrain: cycle?.strain ?? null,
      dayKilojoule: cycle?.kilojoule ?? null,
      avgHr: cycle?.avgHr ?? null,
      maxHr: cycle?.maxHr ?? null,
      cycleAt: cycle?.at ?? null,
    };
    await this.prisma.whoopSnapshot.upsert({
      where: { connectionId: conn.id },
      create: { connectionId: conn.id, ...snap },
      update: snap,
    });
    // История (тайм-серии) — накапливаем по дням для графиков/трендов.
    await this.persistHistory(userId, rec, sleep, cycle);
    // Самолечение: если истории мало (напр. подключились до появления бэкфилла) —
    // ставим бэкфилл в фон, чтобы графики/тренды наполнились.
    const histCount = await this.prisma.whoopRecoveryDay.count({ where: { userId } });
    if (histCount < 7) {
      await this.syncQueue.add('backfill', { userId }, { jobId: `whoop-backfill-${userId}`, removeOnComplete: true, removeOnFail: 100 });
    }
    // Тренировки — идемпотентно по времени старта.
    for (const w of workouts) {
      const data = { end: w.end, sport: w.sport, strain: w.strain, avgHr: w.avgHr, maxHr: w.maxHr, kilojoule: w.kilojoule, distanceM: w.distanceM, zoneMin: w.zoneMin ?? undefined, whoopId: w.whoopId };
      await this.prisma.whoopWorkout.upsert({ where: { userId_start: { userId, start: w.start } }, create: { userId, start: w.start, ...data }, update: data });
    }
    await this.prisma.wearableConnection.update({ where: { id: conn.id }, data: { lastSyncAt: new Date() } });

    // Синергия: подставляем рост/вес в мед.карту, если у пользователя они ещё не заполнены.
    if (body?.heightCm != null || body?.weightKg != null) {
      await this.fillMedicalProfile(userId, body);
    }
    return this.getStatus(userId);
  }

  private async fillMedicalProfile(userId: string, body: { heightCm: number | null; weightKg: number | null }) {
    const profile = await this.prisma.medicalProfile.findUnique({ where: { userId } });
    const patch: { heightCm?: number; weightKg?: number } = {};
    if (body.heightCm != null && profile?.heightCm == null) patch.heightCm = body.heightCm;
    if (body.weightKg != null && profile?.weightKg == null) patch.weightKg = body.weightKg;
    if (Object.keys(patch).length === 0) return;
    await this.prisma.medicalProfile.upsert({
      where: { userId },
      create: { userId, ...patch },
      update: patch,
    });
  }

  private startOfDay(d: Date): Date {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  // Запись последних значений в тайм-серии (идемпотентно по дню/старту).
  private async persistHistory(
    userId: string,
    rec: { recoveryScore?: number | null; hrvMs?: number | null; restingHr?: number | null; spo2?: number | null; skinTempC?: number | null; at?: Date | null } | null,
    sleep: { performance?: number | null; totalMin?: number | null; lightMin?: number | null; deepMin?: number | null; remMin?: number | null; awakeMin?: number | null; respiratoryRate?: number | null; at?: Date | null } | null,
    cycle: { strain?: number | null; avgHr?: number | null; maxHr?: number | null; at?: Date | null } | null,
  ) {
    if (rec?.at) {
      const date = this.startOfDay(new Date(rec.at));
      const data = {
        recoveryScore: rec.recoveryScore ?? null,
        hrvMs: rec.hrvMs ?? null,
        restingHr: rec.restingHr ?? null,
        spo2: rec.spo2 ?? null,
        skinTempC: rec.skinTempC ?? null,
        scoredAt: new Date(rec.at),
      };
      await this.prisma.whoopRecoveryDay.upsert({ where: { userId_date: { userId, date } }, create: { userId, date, ...data }, update: data });
    }
    if (cycle?.at) {
      const date = this.startOfDay(new Date(cycle.at));
      const data = { strain: cycle.strain ?? null, avgHr: cycle.avgHr ?? null, maxHr: cycle.maxHr ?? null };
      await this.prisma.whoopCycleDay.upsert({ where: { userId_date: { userId, date } }, create: { userId, date, ...data }, update: data });
    }
    if (sleep?.at) {
      const start = new Date(sleep.at);
      const end = new Date(start.getTime() + (sleep.totalMin ?? 0) * 60000);
      const data = {
        end,
        inBedMin: sleep.totalMin ?? null,
        performancePct: sleep.performance ?? null,
        lightMin: sleep.lightMin ?? null,
        deepMin: sleep.deepMin ?? null,
        remMin: sleep.remMin ?? null,
        awakeMin: sleep.awakeMin ?? null,
        respiratoryRate: sleep.respiratoryRate ?? null,
      };
      await this.prisma.whoopSleep.upsert({ where: { userId_start: { userId, start } }, create: { userId, start, ...data }, update: data });
    }
  }

  // Бэкфилл истории за `days` дней при подключении (mock и real через провайдер), идемпотентно.
  async backfill(userId: string, days = 30) {
    const conn = await this.prisma.wearableConnection.findUnique({
      where: { userId_provider: { userId, provider: 'WHOOP' } },
    });
    if (!conn || conn.status !== 'CONNECTED') return;
    const access = await this.ensureAccessToken(conn);
    const [recs, sleeps, cycles, workouts] = await Promise.all([
      this.provider.fetchRecoveryHistory(access, days),
      this.provider.fetchSleepHistory(access, days),
      this.provider.fetchCycleHistory(access, days),
      this.provider.fetchWorkouts(access, 25),
    ]);
    for (const r of recs) {
      if (!r.at) continue;
      const date = this.startOfDay(new Date(r.at));
      const data = { recoveryScore: r.recoveryScore ?? null, hrvMs: r.hrvMs ?? null, restingHr: r.restingHr ?? null, spo2: r.spo2 ?? null, skinTempC: r.skinTempC ?? null, scoredAt: new Date(r.at) };
      await this.prisma.whoopRecoveryDay.upsert({ where: { userId_date: { userId, date } }, create: { userId, date, ...data }, update: data });
    }
    for (const c of cycles) {
      if (!c.at) continue;
      const date = this.startOfDay(new Date(c.at));
      const data = { strain: c.strain ?? null, kilojoule: c.kilojoule ?? null, avgHr: c.avgHr ?? null, maxHr: c.maxHr ?? null };
      await this.prisma.whoopCycleDay.upsert({ where: { userId_date: { userId, date } }, create: { userId, date, ...data }, update: data });
    }
    for (const s of sleeps) {
      if (!s.at) continue;
      const start = new Date(s.at);
      const end = new Date(start.getTime() + (s.totalMin ?? 0) * 60_000);
      const data = {
        end, inBedMin: s.totalMin ?? null, performancePct: s.performance ?? null,
        efficiencyPct: s.efficiencyPct ?? null, consistencyPct: s.consistencyPct ?? null, needMin: s.needMin ?? null,
        lightMin: s.lightMin ?? null, deepMin: s.deepMin ?? null, remMin: s.remMin ?? null, awakeMin: s.awakeMin ?? null,
        respiratoryRate: s.respiratoryRate ?? null,
      };
      await this.prisma.whoopSleep.upsert({ where: { userId_start: { userId, start } }, create: { userId, start, ...data }, update: data });
    }
    for (const w of workouts) {
      const data = { end: w.end, sport: w.sport, strain: w.strain, avgHr: w.avgHr, maxHr: w.maxHr, kilojoule: w.kilojoule, distanceM: w.distanceM, zoneMin: w.zoneMin ?? undefined, whoopId: w.whoopId };
      await this.prisma.whoopWorkout.upsert({ where: { userId_start: { userId, start: w.start } }, create: { userId, start: w.start, ...data }, update: data });
    }
    this.logger.log(`WHOOP backfill user=${userId}: rec=${recs.length} sleep=${sleeps.length} cycle=${cycles.length} wo=${workouts.length}`);
  }

  // ── История метрик (для графиков/трендов) ──
  async history(userId: string, metric: string, rangeDays: number) {
    const from = this.startOfDay(new Date(Date.now() - rangeDays * 86_400_000));
    let points: { date: Date; value: number | null }[] = [];
    if (['recovery', 'hrv', 'rhr', 'spo2'].includes(metric)) {
      const rows = await this.prisma.whoopRecoveryDay.findMany({ where: { userId, date: { gte: from } }, orderBy: { date: 'asc' } });
      points = rows.map((r) => ({
        date: r.date,
        value: metric === 'recovery' ? r.recoveryScore : metric === 'hrv' ? r.hrvMs : metric === 'rhr' ? r.restingHr : r.spo2,
      }));
    } else if (metric === 'strain') {
      const rows = await this.prisma.whoopCycleDay.findMany({ where: { userId, date: { gte: from } }, orderBy: { date: 'asc' } });
      points = rows.map((r) => ({ date: r.date, value: r.strain }));
    } else if (metric === 'sleep') {
      const rows = await this.prisma.whoopSleep.findMany({ where: { userId, start: { gte: from }, isNap: false }, orderBy: { start: 'asc' } });
      points = rows.map((r) => ({ date: r.start, value: r.performancePct }));
    } else {
      throw new BadRequestException('Неизвестная метрика');
    }
    return { metric, rangeDays, points: points.filter((p) => p.value != null) };
  }

  // ── Статус + метрики для приложения ──
  async getStatus(userId: string) {
    const conn = await this.prisma.wearableConnection.findUnique({
      where: { userId_provider: { userId, provider: 'WHOOP' } },
      include: { snapshot: true },
    });
    const mode = effectiveWhoopMode();
    if (!conn || conn.status !== 'CONNECTED') {
      return { connected: false, provider: 'WHOOP', mode, lastSyncAt: null, metrics: null };
    }
    const s = conn.snapshot;
    // Последние тренировки + суммарные зоны пульса за последний день с тренировками.
    const workouts = await this.prisma.whoopWorkout.findMany({ where: { userId }, orderBy: { start: 'desc' }, take: 10 });
    const kcal = (kj: number | null | undefined) => (kj != null ? Math.round(kj / 4.184) : null);
    let dayZones: number[] | null = null;
    if (workouts.length) {
      const day = this.startOfDay(workouts[0].start).getTime();
      const todays = workouts.filter((w) => this.startOfDay(w.start).getTime() === day);
      const acc = [0, 0, 0, 0, 0];
      for (const w of todays) {
        const z = (w.zoneMin as number[] | null) ?? [];
        z.forEach((v, i) => { if (i < 5) acc[i] += v ?? 0; });
      }
      if (acc.some((v) => v > 0)) dayZones = acc;
    }
    return {
      connected: true,
      provider: 'WHOOP',
      mode,
      lastSyncAt: conn.lastSyncAt,
      metrics: s
        ? {
            recovery: { score: s.recoveryScore, hrvMs: s.hrvMs, restingHr: s.restingHr, spo2: s.spo2, skinTempC: s.skinTempC, at: s.recoveryAt },
            sleep: {
              performance: s.sleepPerformance,
              totalMinutes: s.sleepTotalMinutes,
              needMinutes: s.sleepNeedMin,
              consistency: s.sleepConsistency,
              efficiency: s.sleepEfficiency,
              stages: { lightMin: s.sleepLightMin, deepMin: s.sleepDeepMin, remMin: s.sleepRemMin, awakeMin: s.sleepAwakeMin },
              respiratoryRate: s.respiratoryRate,
              at: s.sleepAt,
            },
            cycle: { strain: s.dayStrain, calories: kcal(s.dayKilojoule), avgHr: s.avgHr, maxHr: s.maxHr, at: s.cycleAt },
            zones: dayZones,
            workouts: workouts.map((w) => ({
              id: w.id,
              sport: w.sport,
              start: w.start,
              durationMin: Math.round((w.end.getTime() - w.start.getTime()) / 60000),
              strain: w.strain,
              avgHr: w.avgHr,
              maxHr: w.maxHr,
              calories: kcal(w.kilojoule),
              distanceM: w.distanceM,
              zoneMin: w.zoneMin as number[] | null,
            })),
          }
        : null,
    };
  }

  async disconnect(userId: string) {
    await this.prisma.wearableConnection.deleteMany({ where: { userId, provider: 'WHOOP' } });
    // Тайм-серии без FK — чистим вручную.
    await Promise.all([
      this.prisma.whoopRecoveryDay.deleteMany({ where: { userId } }),
      this.prisma.whoopSleep.deleteMany({ where: { userId } }),
      this.prisma.whoopCycleDay.deleteMany({ where: { userId } }),
      this.prisma.whoopWorkout.deleteMany({ where: { userId } }),
    ]);
    return { connected: false };
  }
}
