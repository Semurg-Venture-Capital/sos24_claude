import { PrismaClient, Prisma } from '@prisma/client';

// Импорт справочника «Здоровье» из официального API med24 (доступ предоставлен med24).
// Клиники → Partner (healthDirectory=true; видны только в «Здоровье», не в каталоге «Партнёры»).
// Врачи → Doctor (bookingEnabled=false → «Позвонить» на ресепшн клиники; привязка к Partner).
//
// Запуск:
//   pnpm exec ts-node --transpile-only prisma/import-med24.ts            # both (клиники + врачи)
//   MED24_MODE=clinics MED24_LIMIT=10 pnpm exec ts-node … import-med24.ts # только клиники
//   MED24_MODE=doctors pnpm exec ts-node … import-med24.ts                # только врачи (по уже импортированным клиникам)
// env: MED24_MODE=clinics|doctors|both (по умолч. both), MED24_LIMIT (клиник, по умолч. 10),
//      MED24_TOKEN (необязательно), MED24_BASE.
//
// Стабильные ключи upsert: Partner `med24-clinic-<id>`, Doctor `med24-doc-<docId>-<clinicId>`
// (один врач в нескольких клиниках = отдельная карточка на клинику). Повторный запуск не дублирует.

const prisma = new PrismaClient();

const BASE = process.env.MED24_BASE ?? 'https://main.med24.uz';
const LIMIT = Number(process.env.MED24_LIMIT ?? 10);
const MODE = (process.env.MED24_MODE ?? 'both').toLowerCase();
const TOKEN = process.env.MED24_TOKEN;

// UA обязателен: без него app/doctors отдаёт 403.
const headers: Record<string, string> = {
  Accept: 'application/json',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
};
if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

// ── Область по координатам: ближайший из 14 центров РУз (названия строго как HealthService.REGIONS) ──
const REGION_CENTERS: Array<{ region: string; lat: number; lng: number }> = [
  { region: 'Ташкент', lat: 41.311, lng: 69.279 },
  { region: 'Ташкентская', lat: 41.0, lng: 69.6 },
  { region: 'Андижанская', lat: 40.78, lng: 72.34 },
  { region: 'Бухарская', lat: 39.77, lng: 64.42 },
  { region: 'Джизакская', lat: 40.12, lng: 67.84 },
  { region: 'Кашкадарьинская', lat: 38.86, lng: 65.79 },
  { region: 'Навоийская', lat: 40.1, lng: 65.38 },
  { region: 'Наманганская', lat: 40.99, lng: 71.67 },
  { region: 'Самаркандская', lat: 39.65, lng: 66.96 },
  { region: 'Сурхандарьинская', lat: 37.94, lng: 67.57 },
  { region: 'Сырдарьинская', lat: 40.48, lng: 68.78 },
  { region: 'Ферганская', lat: 40.39, lng: 71.78 },
  { region: 'Хорезмская', lat: 41.55, lng: 60.63 },
  { region: 'Каракалпакстан', lat: 42.46, lng: 59.61 },
];

function regionByCoords(lat: number | null, lng: number | null): string | null {
  if (lat == null || lng == null) return null;
  let best: string | null = null;
  let bestD = Infinity;
  for (const c of REGION_CENTERS) {
    const d = (c.lat - lat) ** 2 + (c.lng - lng) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c.region;
    }
  }
  return best;
}

const REGION_CITY: Record<string, string> = {
  Ташкент: 'Ташкент',
  Ташкентская: 'Ташкентская обл.',
  Андижанская: 'Андижан',
  Бухарская: 'Бухара',
  Джизакская: 'Джизак',
  Кашкадарьинская: 'Карши',
  Навоийская: 'Навои',
  Наманганская: 'Наманган',
  Самаркандская: 'Самарканд',
  Сурхандарьинская: 'Термез',
  Сырдарьинская: 'Гулистан',
  Ферганская: 'Фергана',
  Хорезмская: 'Ургенч',
  Каракалпакстан: 'Нукус',
};

// ── Парс графика работы med24 ("Пн – Сб", "09:00 – 16:00") в структуру workingHours ──
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_RU: Record<string, number> = { пн: 0, вт: 1, ср: 2, чт: 3, пт: 4, сб: 5, вс: 6 };

function parseWorkingHours(
  workDays?: string | null,
  workHours?: string | null,
): Prisma.InputJsonValue | undefined {
  if (!workDays || !workHours) return undefined;
  const hm = workHours.match(/(\d{1,2}:\d{2})\s*[–\-—]\s*(\d{1,2}:\d{2})/);
  if (!hm) return undefined;
  const [open, close] = [hm[1], hm[2]];
  const dm = workDays.toLowerCase().match(/([а-я]{2})\s*[–\-—]\s*([а-я]{2})/);
  const result: Record<string, { open: string; close: string } | null> = {};
  for (const k of DAY_KEYS) result[k] = null;
  if (dm && DAY_RU[dm[1]] != null && DAY_RU[dm[2]] != null) {
    for (let i = DAY_RU[dm[1]]; i <= DAY_RU[dm[2]]; i++) result[DAY_KEYS[i]] = { open, close };
  } else {
    for (let i = 0; i <= 4; i++) result[DAY_KEYS[i]] = { open, close };
  }
  return result as Prisma.InputJsonValue;
}

function parseYears(v: unknown): number | null {
  if (typeof v === 'number') return v > 0 ? Math.round(v) : null;
  if (typeof v === 'string') {
    const m = v.match(/\d+/);
    if (m) return Number(m[0]);
  }
  return null;
}

async function fetchJson<T>(url: string): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return (await res.json()) as T;
    } catch (e) {
      if (attempt === 2) throw e;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw new Error('unreachable');
}

interface ClinicDetail {
  id: number;
  name: string;
  address?: string | null;
  description?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  phones?: string[];
  reviews_count?: number;
  reviews_score?: number;
  work_days?: string | null;
  work_hours?: string | null;
}

// ── Импорт клиник ──
async function importClinics() {
  console.log(`med24: клиники — тяну ${LIMIT}`);
  const list = await fetchJson<{ data: Array<{ id: number }> }>(
    `${BASE}/api/v1/app/clinics?per_page=${LIMIT}&page=1`,
  );
  const ids = list.data.map((c) => c.id).slice(0, LIMIT);
  let ok = 0;
  for (const id of ids) {
    try {
      const resp = await fetchJson<{ data: ClinicDetail } | ClinicDetail>(
        `${BASE}/api/v1/app/clinics/${id}`,
      );
      const c: ClinicDetail = (resp as { data?: ClinicDetail }).data ?? (resp as ClinicDetail);
      const lat = c.latitude ? Number(c.latitude) : null;
      const lng = c.longitude ? Number(c.longitude) : null;
      const region = regionByCoords(lat, lng);
      const pid = `med24-clinic-${c.id}`;
      const data = {
        name: c.name,
        address: c.address || '—',
        description: c.description?.trim() || null,
        phone: c.phones?.[0] ?? null,
        region,
        city: region ? REGION_CITY[region] ?? 'Ташкент' : 'Ташкент',
        lat,
        lng,
        rating: c.reviews_score ?? 0,
        reviewCount: c.reviews_count ?? 0,
        healthDirectory: true,
        active: true,
        workingHours: parseWorkingHours(c.work_days, c.work_hours),
      };
      const p = await prisma.partner.upsert({ where: { id: pid }, create: { id: pid, ...data }, update: data });
      ok++;
      console.log(`  ✓ ${p.name} · ${p.region ?? '—'} · ${p.phone ?? 'без тел.'}${c.description ? ' · +описание' : ''}`);
    } catch (e) {
      console.warn(`  ✗ клиника ${id}: ${(e as Error).message}`);
    }
  }
  console.log(`med24: клиники — готово ${ok}/${ids.length}`);
}

interface AppDoctor {
  id: number;
  name: string;
  rank?: string | null;
  experience?: unknown;
  reviews_count?: number;
  reviews_score?: number;
  clinic_id?: number;
  clinic_name?: string | null;
  clinic_phones?: string[];
  specialties?: Array<{ name?: string }>;
}

// ── Импорт врачей (по уже импортированным клиникам) ──
async function importDoctors() {
  // Карта med24-clinic-id → { partnerId, city }
  const clinics = await prisma.partner.findMany({
    where: { id: { startsWith: 'med24-clinic-' }, healthDirectory: true },
    select: { id: true, city: true },
  });
  const wanted = new Map<number, { partnerId: string; city: string | null }>();
  for (const c of clinics) {
    const mid = Number(c.id.replace('med24-clinic-', ''));
    if (Number.isFinite(mid)) wanted.set(mid, { partnerId: c.id, city: c.city });
  }
  if (wanted.size === 0) {
    console.log('med24: врачи — нет импортированных клиник, пропускаю');
    return;
  }
  console.log(`med24: врачи — фильтрую по ${wanted.size} клиникам (пагинация app/doctors)`);

  let page = 1;
  let scanned = 0;
  const perClinic = new Map<string, number>();
  while (true) {
    const d = await fetchJson<{ data: AppDoctor[]; meta?: { last_page?: number } }>(
      `${BASE}/api/v1/app/doctors?per_page=500&page=${page}`,
    );
    const rows = d.data ?? [];
    if (rows.length === 0) break;
    for (const o of rows) {
      const target = o.clinic_id != null ? wanted.get(o.clinic_id) : undefined;
      if (!target) continue;
      const did = `med24-doc-${o.id}-${o.clinic_id}`;
      const data = {
        partnerId: target.partnerId,
        fullName: o.name,
        specialty: o.specialties?.[0]?.name ?? 'Врач',
        bookingEnabled: false, // «Позвонить» на ресепшн клиники
        phone: null as string | null, // fallback → телефон клиники (Partner.phone)
        clinicName: o.clinic_name ?? null,
        city: target.city,
        experienceY: parseYears(o.experience),
        rating: o.reviews_score ?? 0,
        reviewCount: o.reviews_count ?? 0,
        verified: false,
        active: true,
      };
      await prisma.doctor.upsert({ where: { id: did }, create: { id: did, ...data }, update: data });
      perClinic.set(target.partnerId, (perClinic.get(target.partnerId) ?? 0) + 1);
    }
    scanned++;
    const last = d.meta?.last_page ?? page;
    if (page >= last) break;
    page++;
    await new Promise((r) => setTimeout(r, 400)); // бережно к API
  }
  const total = [...perClinic.values()].reduce((a, b) => a + b, 0);
  console.log(`med24: врачи — готово, ${total} карточек (просканировано ${scanned} стр.)`);
  for (const [pid, n] of perClinic) console.log(`  · ${pid}: ${n}`);
}

async function main() {
  console.log(`med24 import: mode=${MODE} base=${BASE} ${TOKEN ? '(с токеном)' : '(без токена)'}`);
  if (MODE === 'clinics' || MODE === 'both') await importClinics();
  if (MODE === 'doctors' || MODE === 'both') await importDoctors();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
