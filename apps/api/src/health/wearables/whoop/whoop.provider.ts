// Провайдер WHOOP: интерфейс + mock-реализация (Фаза 1) + реальная реализация (готова, но
// требует ключей и сверки эндпоинтов v2 при подключении аккаунта). Переключение — через
// effectiveWhoopMode(). Сигнатуры менять не нужно при переходе mock → real.

import { Logger } from '@nestjs/common';
import {
  WHOOP_API_BASE,
  WHOOP_AUTH_URL,
  WHOOP_CLIENT_ID,
  WHOOP_CLIENT_SECRET,
  WHOOP_REDIRECT_URI,
  WHOOP_SCOPES,
  WHOOP_TOKEN_URL,
  effectiveWhoopMode,
} from './whoop.config';

// ── Данные, нормализованные под наши поля WhoopSnapshot ──
export interface WhoopTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresInSec: number;
  scope: string | null;
  providerUserId: string | null;
}

export interface RecoveryData {
  recoveryScore: number | null;
  hrvMs: number | null;
  restingHr: number | null;
  spo2: number | null;
  skinTempC: number | null;
  at: Date | null;
}

export interface SleepData {
  performance: number | null;
  totalMin: number | null;
  lightMin: number | null;
  deepMin: number | null;
  remMin: number | null;
  awakeMin: number | null;
  respiratoryRate: number | null;
  needMin: number | null; // потребность в сне
  efficiencyPct: number | null;
  consistencyPct: number | null;
  at: Date | null;
}

export interface CycleData {
  strain: number | null;
  kilojoule: number | null;
  avgHr: number | null;
  maxHr: number | null;
  at: Date | null;
}

export interface WorkoutData {
  whoopId: string | null;
  start: Date;
  end: Date;
  sport: string | null;
  strain: number | null;
  avgHr: number | null;
  maxHr: number | null;
  kilojoule: number | null;
  distanceM: number | null;
  zoneMin: number[] | null; // [z1..z5] минуты
}

export interface BodyData {
  heightCm: number | null;
  weightKg: number | null;
}

export interface WhoopProvider {
  buildAuthorizeUrl(state: string): string;
  exchangeCode(code: string): Promise<WhoopTokens>;
  refresh(refreshToken: string): Promise<WhoopTokens>;
  fetchRecovery(accessToken: string): Promise<RecoveryData | null>;
  fetchSleep(accessToken: string): Promise<SleepData | null>;
  fetchCycle(accessToken: string): Promise<CycleData | null>;
  fetchWorkouts(accessToken: string, limit?: number): Promise<WorkoutData[]>;
  fetchBody(accessToken: string): Promise<BodyData | null>;
}

const msToMin = (ms: number | null | undefined): number | null =>
  ms == null ? null : Math.round(ms / 60000);

// ─────────────────────────────── MOCK ───────────────────────────────
// Детерминированные, но правдоподобные данные. Авторизация «самоодобряется»: authorize-URL
// ведёт сразу на наш callback с фиктивным кодом — весь флоу проходится без аккаунта WHOOP.
export class MockWhoopProvider implements WhoopProvider {
  buildAuthorizeUrl(state: string): string {
    const u = new URL(WHOOP_REDIRECT_URI);
    u.searchParams.set('code', 'MOCK_CODE');
    u.searchParams.set('state', state);
    return u.toString();
  }

  async exchangeCode(_code: string): Promise<WhoopTokens> {
    return {
      accessToken: 'mock-access-' + Date.now(),
      refreshToken: 'mock-refresh',
      expiresInSec: 3600,
      scope: WHOOP_SCOPES,
      providerUserId: 'mock-whoop-user',
    };
  }

  async refresh(_refreshToken: string): Promise<WhoopTokens> {
    return {
      accessToken: 'mock-access-' + Date.now(),
      refreshToken: 'mock-refresh',
      expiresInSec: 3600,
      scope: WHOOP_SCOPES,
      providerUserId: 'mock-whoop-user',
    };
  }

  async fetchRecovery(): Promise<RecoveryData> {
    return { recoveryScore: 72, hrvMs: 58.3, restingHr: 56, spo2: 97.2, skinTempC: 33.4, at: new Date() };
  }

  async fetchSleep(): Promise<SleepData> {
    return {
      performance: 88,
      totalMin: 456,
      lightMin: 210,
      deepMin: 96,
      remMin: 132,
      awakeMin: 18,
      respiratoryRate: 14.6,
      needMin: 502,
      efficiencyPct: 92,
      consistencyPct: 74,
      at: new Date(),
    };
  }

  async fetchCycle(): Promise<CycleData> {
    return { strain: 11.4, kilojoule: 8960, avgHr: 78, maxHr: 141, at: new Date() };
  }

  async fetchWorkouts(): Promise<WorkoutData[]> {
    const now = Date.now();
    return [
      {
        whoopId: 'mock-wo-1', start: new Date(now - 5 * 3600_000), end: new Date(now - 5 * 3600_000 + 42 * 60_000),
        sport: 'Бег', strain: 8.2, avgHr: 152, maxHr: 176, kilojoule: 1715, distanceM: 6800, zoneMin: [4, 9, 16, 10, 3],
      },
      {
        whoopId: 'mock-wo-2', start: new Date(now - 28 * 3600_000), end: new Date(now - 28 * 3600_000 + 55 * 60_000),
        sport: 'Ходьба', strain: 4.6, avgHr: 108, maxHr: 128, kilojoule: 990, distanceM: 4200, zoneMin: [22, 25, 7, 1, 0],
      },
    ];
  }

  async fetchBody(): Promise<BodyData> {
    return { heightCm: 178, weightKg: 74 };
  }
}

// ─────────────────────────────── REAL ───────────────────────────────
// Готовая структура под реальный API v2. Пути эндпоинтов сверить по developer.whoop.com при
// подключении ключей (помечено TODO). До этого effectiveWhoopMode() держит нас на mock.
export class RealWhoopProvider implements WhoopProvider {
  private readonly logger = new Logger('WhoopProvider');

  buildAuthorizeUrl(state: string): string {
    const u = new URL(WHOOP_AUTH_URL);
    u.searchParams.set('response_type', 'code');
    u.searchParams.set('client_id', WHOOP_CLIENT_ID);
    u.searchParams.set('redirect_uri', WHOOP_REDIRECT_URI);
    u.searchParams.set('scope', WHOOP_SCOPES);
    u.searchParams.set('state', state);
    return u.toString();
  }

  private async token(params: Record<string, string>): Promise<WhoopTokens> {
    const body = new URLSearchParams({
      client_id: WHOOP_CLIENT_ID,
      client_secret: WHOOP_CLIENT_SECRET,
      ...params,
    });
    const res = await fetch(WHOOP_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) throw new Error(`WHOOP token error ${res.status}: ${await res.text()}`);
    const j: any = await res.json();
    return {
      accessToken: j.access_token,
      refreshToken: j.refresh_token ?? null,
      expiresInSec: j.expires_in ?? 3600,
      scope: j.scope ?? null,
      providerUserId: null,
    };
  }

  exchangeCode(code: string): Promise<WhoopTokens> {
    return this.token({ grant_type: 'authorization_code', code, redirect_uri: WHOOP_REDIRECT_URI });
  }

  refresh(refreshToken: string): Promise<WhoopTokens> {
    return this.token({ grant_type: 'refresh_token', refresh_token: refreshToken, scope: WHOOP_SCOPES });
  }

  private async get(accessToken: string, path: string): Promise<any | null> {
    // Пути v2 сверены по developer.whoop.com/api (база .../developer + /v2/...).
    const res = await fetch(`${WHOOP_API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      this.logger.warn(`WHOOP GET ${path} → ${res.status}`);
      return null;
    }
    return res.json();
  }

  // Коллекции v2 возвращают { records: [...] } — берём самую свежую запись.
  private latest(json: any): any | null {
    if (!json) return null;
    const arr = json.records ?? json.data ?? (Array.isArray(json) ? json : null);
    return Array.isArray(arr) ? (arr[0] ?? null) : json;
  }

  async fetchRecovery(accessToken: string): Promise<RecoveryData | null> {
    const rec = this.latest(await this.get(accessToken, '/developer/v2/recovery?limit=1'));
    const s = rec?.score;
    if (!s) return null;
    return {
      recoveryScore: s.recovery_score ?? null,
      hrvMs: s.hrv_rmssd_milli ?? null,
      restingHr: s.resting_heart_rate ?? null,
      spo2: s.spo2_percentage ?? null,
      skinTempC: s.skin_temp_celsius ?? null,
      at: rec?.updated_at ? new Date(rec.updated_at) : null,
    };
  }

  async fetchSleep(accessToken: string): Promise<SleepData | null> {
    const sl = this.latest(await this.get(accessToken, '/developer/v2/activity/sleep?limit=1'));
    const st = sl?.score?.stage_summary;
    const need = sl?.score?.sleep_needed;
    if (!sl?.score) return null;
    const needTotal = need
      ? (need.baseline_milli ?? 0) + (need.need_from_sleep_debt_milli ?? 0) + (need.need_from_recent_strain_milli ?? 0) + (need.need_from_recent_nap_milli ?? 0)
      : null;
    return {
      performance: sl.score.sleep_performance_percentage ?? null,
      totalMin: msToMin(
        (st?.total_light_sleep_time_milli ?? 0) +
          (st?.total_slow_wave_sleep_time_milli ?? 0) +
          (st?.total_rem_sleep_time_milli ?? 0),
      ),
      lightMin: msToMin(st?.total_light_sleep_time_milli),
      deepMin: msToMin(st?.total_slow_wave_sleep_time_milli),
      remMin: msToMin(st?.total_rem_sleep_time_milli),
      awakeMin: msToMin(st?.total_awake_time_milli),
      respiratoryRate: sl.score.respiratory_rate ?? null,
      needMin: needTotal != null ? msToMin(needTotal) : null,
      efficiencyPct: sl.score.sleep_efficiency_percentage != null ? Math.round(sl.score.sleep_efficiency_percentage) : null,
      consistencyPct: sl.score.sleep_consistency_percentage ?? null,
      at: sl?.end ? new Date(sl.end) : null,
    };
  }

  async fetchCycle(accessToken: string): Promise<CycleData | null> {
    const c = this.latest(await this.get(accessToken, '/developer/v2/cycle?limit=1'));
    if (!c?.score) return null;
    return {
      strain: c.score.strain ?? null,
      kilojoule: c.score.kilojoule ?? null,
      avgHr: c.score.average_heart_rate ?? null,
      maxHr: c.score.max_heart_rate ?? null,
      at: c?.start ? new Date(c.start) : null,
    };
  }

  async fetchWorkouts(accessToken: string, limit = 10): Promise<WorkoutData[]> {
    const json = await this.get(accessToken, `/developer/v2/activity/workout?limit=${limit}`);
    const arr: any[] = json?.records ?? (Array.isArray(json) ? json : []);
    return arr
      .filter((w) => w?.start && w?.end)
      .map((w) => {
        const sc = w.score ?? {};
        const z = sc.zone_duration ?? {};
        const zoneMin = ['zone_one_milli', 'zone_two_milli', 'zone_three_milli', 'zone_four_milli', 'zone_five_milli'].map((k) => msToMin(z[k]) ?? 0);
        return {
          whoopId: w.id != null ? String(w.id) : null,
          start: new Date(w.start),
          end: new Date(w.end),
          sport: w.sport_name ?? (w.sport_id != null ? `Sport ${w.sport_id}` : null),
          strain: sc.strain ?? null,
          avgHr: sc.average_heart_rate ?? null,
          maxHr: sc.max_heart_rate ?? null,
          kilojoule: sc.kilojoule ?? null,
          distanceM: sc.distance_meter ?? null,
          zoneMin: zoneMin.some((v) => v > 0) ? zoneMin : null,
        };
      });
  }

  async fetchBody(accessToken: string): Promise<BodyData | null> {
    const b = await this.get(accessToken, '/developer/v2/user/measurement/body');
    if (!b) return null;
    return {
      heightCm: b.height_meter != null ? Math.round(b.height_meter * 100) : null,
      weightKg: b.weight_kilogram != null ? Math.round(b.weight_kilogram) : null,
    };
  }
}

let cached: WhoopProvider | null = null;
export function getWhoopProvider(): WhoopProvider {
  // Пересоздаём при смене режима (тесты/переключение env).
  const mode = effectiveWhoopMode();
  if (!cached || (cached instanceof MockWhoopProvider) !== (mode === 'mock')) {
    cached = mode === 'real' ? new RealWhoopProvider() : new MockWhoopProvider();
  }
  return cached;
}
