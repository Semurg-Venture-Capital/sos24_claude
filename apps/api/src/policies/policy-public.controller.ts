import { Controller, Get, Header, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PoliciesService } from './policies.service';

// Публичная проверка подлинности полиса по QR-токену. БЕЗ авторизации.
// QR в приложении ведёт на /v/<token>. Отдаём человекочитаемую HTML-страницу.
@ApiTags('public')
@Controller('v')
export class PolicyPublicController {
  constructor(private readonly service: PoliciesService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Публичная страница проверки полиса по QR-токену (HTML)' })
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  async verify(@Param('token') token: string): Promise<string> {
    const res = await this.service.findPublic(token);
    if (!res) return notFoundPage();
    return verifyPage(res);
  }
}

const TYPE_LABEL: Record<string, string> = {
  OSAGO: 'ОСАГО',
  KASKO: 'КАСКО',
  HEALTH: 'Медицинский полис',
  HOME: 'Полис на имущество',
  FINANCE: 'Финансовый полис',
  LIFE: 'Страхование жизни',
  TRAVEL: 'Туристический полис',
  OTHER: 'Страховой полис',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Черновик',
  PENDING: 'Ожидает оплаты',
  ACTIVE: 'Действует',
  EXPIRED: 'Истёк',
  CANCELLED: 'Аннулирован',
};

function esc(s?: string | null): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function fmtDate(d?: Date | string | null): string {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getUTCDate()).padStart(2, '0')}.${String(dt.getUTCMonth() + 1).padStart(2, '0')}.${dt.getUTCFullYear()}`;
}

function shell(body: string): string {
  return `<!doctype html><html lang="ru"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<link rel="icon" href="/favicon.ico" sizes="any" />
<title>SOS24 — проверка полиса</title>
<style>
  *{box-sizing:border-box} body{margin:0;font-family:-apple-system,Segoe UI,Roboto,Inter,sans-serif;background:#f4f4f5;color:#151515}
  .wrap{max-width:520px;margin:0 auto;padding:24px 16px}
  .brand{display:flex;align-items:center;gap:8px;font-weight:800;font-size:22px;letter-spacing:-0.01em;margin-bottom:16px}
  .brand svg{width:24px;height:25px;display:block}
  .card{background:#fff;border:1px solid #ececec;border-radius:20px;padding:20px;margin-bottom:14px}
  .banner{border-radius:16px;padding:16px 18px;color:#fff;display:flex;align-items:center;gap:12px;margin-bottom:14px;font-weight:600}
  .banner.ok{background:#0a9466} .banner.bad{background:#c01020}
  .banner .ic{font-size:26px;line-height:1}
  .row{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px}
  .row:last-child{border-bottom:none}
  .row .k{color:#8a8a8a} .row .v{font-weight:600;text-align:right}
  h1{font-size:18px;margin:0 0 12px}
  .muted{color:#8a8a8a;font-size:12px;margin-top:8px;text-align:center}
  .btn{display:block;width:100%;text-align:center;padding:14px;border-radius:14px;border:none;font-size:15px;font-weight:700;margin-top:14px}
  .btn.dis{background:#e8e8e8;color:#a0a0a0}
  .tag{display:inline-block;background:#151515;color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;margin-bottom:8px}
</style></head><body><div class="wrap">
<div class="brand"><svg viewBox="0 0 19.25 20" fill="none" aria-hidden="true"><path fill="#e61428" d="M19.18 8.246c-.09-1.171-.298-2.313-.717-3.41C17.676 2.775 16.248 1.376 14.182.655 12.704.138 11.168 0 9.411 0 8.241-.006 6.883.118 5.557.497 3.472 1.093 1.907 2.325.983 4.328.354 5.692.131 7.152.042 8.637c-.063 1.053-.056 2.105.03 3.157.103 1.255.316 2.485.788 3.659.636 1.576 1.712 2.741 3.229 3.478 1.342.652 2.779.923 4.253 1.027.977.069 1.953.049 2.929-.035 1.004-.087 1.992-.256 2.949-.576 1.096-.366 2.075-.925 2.863-1.797.973-1.078 1.526-2.365 1.808-3.771.366-1.827.432-3.675.289-5.533zm-2.589 3.751c-.486 1.286-1.299 2.343-2.259 3.298-.834.829-1.752 1.541-2.827 2.03-.657.299-1.343.485-2.064.52-.317.015-.633-.028-.938-.122-.121-.038-.234-.094-.33-.179-.18-.156-.179-.322.012-.464.23-.169.47-.323.701-.489.676-.485 1.233-1.086 1.699-1.775.077-.115.142-.24.201-.367.053-.115.058-.234-.047-.33-.106-.096-.226-.111-.349-.046-.135.07-.265.15-.398.225-1.248.708-2.577 1.006-3.99.696-1.979-.435-3.136-1.734-3.642-3.671-.096-.368-.14-.746-.127-1.057.004-1.198.345-2.231.908-3.182 1.06-1.79 2.493-3.201 4.334-4.169.619-.325 1.28-.537 1.977-.619.385-.046.765-.025 1.142.059.058.013.118.027.172.051.181.08.391.152.421.381s-.179.308-.334.4c-.906.543-1.669 1.239-2.251 2.129-.07.106-.137.213-.173.336-.041.143-.043.282.082.385.118.099.248.074.371.004.379-.217.753-.444 1.158-.611 1.306-.541 2.634-.635 3.959-.105 1.517.607 2.424 1.78 2.85 3.341.311 1.135.152 2.246-.258 3.331z"/></svg><span>SOS24</span></div>
${body}
<p class="muted">Проверка подлинности полиса · sos24.uz</p>
</div></body></html>`;
}

function verifyPage(res: { policy: any; valid: boolean }): string {
  const p = res.policy;
  const owner = esc([p.user?.surname, p.user?.name].filter(Boolean).join(' ')) || '—';
  const vehicle = p.vehicle ? `${esc(p.vehicle.brand)} ${esc(p.vehicle.model)}` : null;
  const plate = p.vehicle?.plate ? esc(p.vehicle.plate) : null;
  const company = esc(p.company?.name) || 'SOS24';

  const banner = res.valid
    ? `<div class="banner ok"><span class="ic">✓</span><span>Полис действителен</span></div>`
    : `<div class="banner bad"><span class="ic">✕</span><span>Полис недействителен</span></div>`;

  return shell(`
${banner}
<div class="card">
  <span class="tag">${esc(TYPE_LABEL[p.type] ?? 'Полис')}</span>
  <h1>${esc(p.policyNumber ?? '—')}</h1>
  <div class="row"><span class="k">Статус</span><span class="v">${esc(STATUS_LABEL[p.status] ?? p.status)}</span></div>
  <div class="row"><span class="k">Действует с</span><span class="v">${fmtDate(p.startDate)}</span></div>
  <div class="row"><span class="k">Действует по</span><span class="v">${fmtDate(p.endDate)}</span></div>
  ${vehicle ? `<div class="row"><span class="k">Автомобиль</span><span class="v">${vehicle}</span></div>` : ''}
  ${plate ? `<div class="row"><span class="k">Госномер</span><span class="v">${plate}</span></div>` : ''}
  <div class="row"><span class="k">Страхователь</span><span class="v">${owner}</span></div>
  <div class="row"><span class="k">Страховая</span><span class="v">${company}</span></div>
</div>
<button class="btn dis" disabled>Скачать PDF — скоро</button>
<p class="muted">PDF-полис скоро станет доступен для скачивания.</p>
`);
}

function notFoundPage(): string {
  return shell(`
<div class="banner bad"><span class="ic">✕</span><span>Полис не найден</span></div>
<div class="card">Полис по этой ссылке не найден. Проверьте корректность QR-кода.</div>`);
}
