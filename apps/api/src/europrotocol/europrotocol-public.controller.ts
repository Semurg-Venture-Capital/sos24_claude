import { Controller, Get, Header, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EuroprotocolService } from './europrotocol.service';

// Публичная проверка подлинности европротокола по QR-токену. БЕЗ авторизации.
// QR в PDF ведёт на /p/<token>. Отдаём человекочитаемую HTML-страницу.
@ApiTags('public')
@Controller('p')
export class EuroprotocolPublicController {
  constructor(private readonly service: EuroprotocolService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Публичная страница проверки европротокола по QR-токену (HTML)' })
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  async verify(@Param('token') token: string): Promise<string> {
    const res = await this.service.findPublic(token);
    if (!res) return notFoundPage();
    return verifyPage(res);
  }
}

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'Подано',
  REVIEW: 'На рассмотрении',
  NEED_INFO: 'Требуется информация',
  APPROVED: 'Одобрено',
  REJECTED: 'Отклонено',
  PAID: 'Выплачено',
};

function esc(s?: string | null): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function fmtDate(d?: Date | null): string {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getUTCDate()).padStart(2, '0')}.${String(dt.getUTCMonth() + 1).padStart(2, '0')}.${dt.getUTCFullYear()}`;
}

function name(u?: { name?: string | null; surname?: string | null } | null): string {
  if (!u) return '—';
  return esc([u.surname, u.name].filter(Boolean).join(' ')) || '—';
}

function shell(body: string): string {
  return `<!doctype html><html lang="ru"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<link rel="icon" href="/favicon.ico" sizes="any" />
<title>SOS24 — проверка европротокола</title>
<style>
  *{box-sizing:border-box} body{margin:0;font-family:-apple-system,Segoe UI,Roboto,Inter,sans-serif;background:#f4f4f5;color:#151515}
  .wrap{max-width:520px;margin:0 auto;padding:24px 16px}
  .brand{display:flex;align-items:center;gap:8px;font-weight:800;font-size:22px;letter-spacing:-0.01em;margin-bottom:16px}
  .brand svg{width:24px;height:25px;display:block}
  .card{background:#fff;border:1px solid #ececec;border-radius:20px;padding:20px;margin-bottom:14px}
  .banner{border-radius:16px;padding:16px 18px;color:#fff;display:flex;align-items:center;gap:12px;margin-bottom:14px}
  .banner.ok{background:#0a9466} .banner.bad{background:#c01020}
  .banner .ic{font-size:26px} .banner b{font-size:17px} .banner div{font-size:13px;opacity:.92}
  .row{display:flex;justify-content:space-between;gap:16px;padding:9px 0;border-bottom:1px solid #f4f4f4}
  .row:last-child{border:0} .row .l{color:#9a9a9a;font-size:13px} .row .v{font-size:14px;text-align:right;font-weight:500}
  .sec{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#9a9a9a;font-weight:700;margin-bottom:6px}
  .foot{color:#9a9a9a;font-size:12px;text-align:center;margin-top:18px;line-height:1.5}
  .pill{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700;background:#eee}
</style></head><body><div class="wrap">
  <div class="brand"><svg viewBox="0 0 19.25 20" fill="none" aria-hidden="true"><path fill="#e61428" d="M19.18 8.246c-.09-1.171-.298-2.313-.717-3.41C17.676 2.775 16.248 1.376 14.182.655 12.704.138 11.168 0 9.411 0 8.241-.006 6.883.118 5.557.497 3.472 1.093 1.907 2.325.983 4.328.354 5.692.131 7.152.042 8.637c-.063 1.053-.056 2.105.03 3.157.103 1.255.316 2.485.788 3.659.636 1.576 1.712 2.741 3.229 3.478 1.342.652 2.779.923 4.253 1.027.977.069 1.953.049 2.929-.035 1.004-.087 1.992-.256 2.949-.576 1.096-.366 2.075-.925 2.863-1.797.973-1.078 1.526-2.365 1.808-3.771.366-1.827.432-3.675.289-5.533zm-2.589 3.751c-.486 1.286-1.299 2.343-2.259 3.298-.834.829-1.752 1.541-2.827 2.03-.657.299-1.343.485-2.064.52-.317.015-.633-.028-.938-.122-.121-.038-.234-.094-.33-.179-.18-.156-.179-.322.012-.464.23-.169.47-.323.701-.489.676-.485 1.233-1.086 1.699-1.775.077-.115.142-.24.201-.367.053-.115.058-.234-.047-.33-.106-.096-.226-.111-.349-.046-.135.07-.265.15-.398.225-1.248.708-2.577 1.006-3.99.696-1.979-.435-3.136-1.734-3.642-3.671-.096-.368-.14-.746-.127-1.057.004-1.198.345-2.231.908-3.182 1.06-1.79 2.493-3.201 4.334-4.169.619-.325 1.28-.537 1.977-.619.385-.046.765-.025 1.142.059.058.013.118.027.172.051.181.08.391.152.421.381s-.179.308-.334.4c-.906.543-1.669 1.239-2.251 2.129-.07.106-.137.213-.173.336-.041.143-.043.282.082.385.118.099.248.074.371.004.379-.217.753-.444 1.158-.611 1.306-.541 2.634-.635 3.959-.105 1.517.607 2.424 1.78 2.85 3.341.311 1.135.152 2.246-.258 3.331z"/></svg><span>SOS24</span></div>
  ${body}
  <div class="foot">Электронное извещение о ДТП (европротокол).<br/>Проверка подлинности через защищённую ссылку SOS24.</div>
</div></body></html>`;
}

function notFoundPage(): string {
  return shell(`
  <div class="banner bad"><span class="ic">✕</span><div><b>Документ не найден</b><div>Неверная или устаревшая ссылка.</div></div></div>
  <div class="card">Европротокол по этой ссылке не найден. Проверьте корректность QR-кода.</div>`);
}

interface PublicData {
  p: {
    number: string;
    incidentDate: Date;
    incidentTime: string;
    place: string;
    status: string;
    signedAAt: Date | null;
    signedBAt: Date | null;
    createdAt: Date;
    otherGov: string | null;
    user: { name: string | null; surname: string | null } | null;
    vehicle: { plate: string | null; brand: string | null; model: string | null } | null;
    participant: { name: string | null; surname: string | null } | null;
  };
  valid: boolean;
  bothSigned: boolean;
}

function verifyPage({ p, valid, bothSigned }: PublicData): string {
  const banner = valid
    ? `<div class="banner ok"><span class="ic">✓</span><div><b>Действителен</b><div>Подписан обеими сторонами</div></div></div>`
    : `<div class="banner bad"><span class="ic">!</span><div><b>${bothSigned ? 'Недействителен' : 'Не подписан полностью'}</b><div>${
        bothSigned ? 'Статус: ' + (STATUS_LABEL[p.status] ?? p.status) : 'Нет подписи одной из сторон'
      }</div></div></div>`;

  return shell(`
  ${banner}
  <div class="card">
    <div class="sec">Извещение</div>
    <div class="row"><span class="l">Номер</span><span class="v">${esc(p.number)}</span></div>
    <div class="row"><span class="l">Дата · время ДТП</span><span class="v">${fmtDate(p.incidentDate)} · ${esc(p.incidentTime)}</span></div>
    <div class="row"><span class="l">Место</span><span class="v">${esc(p.place)}</span></div>
    <div class="row"><span class="l">Статус</span><span class="v"><span class="pill">${STATUS_LABEL[p.status] ?? esc(p.status)}</span></span></div>
  </div>
  <div class="card">
    <div class="sec">Сторона A</div>
    <div class="row"><span class="l">Водитель</span><span class="v">${name(p.user)}</span></div>
    <div class="row"><span class="l">Госномер</span><span class="v">${esc(p.vehicle?.plate) || '—'}</span></div>
    <div class="row"><span class="l">Подпись</span><span class="v">${p.signedAAt ? '✓ ' + fmtDate(p.signedAAt) : '— нет'}</span></div>
  </div>
  <div class="card">
    <div class="sec">Сторона B</div>
    <div class="row"><span class="l">Участник</span><span class="v">${name(p.participant)}</span></div>
    <div class="row"><span class="l">Госномер</span><span class="v">${esc(p.otherGov) || '—'}</span></div>
    <div class="row"><span class="l">Подпись</span><span class="v">${p.signedBAt ? '✓ ' + fmtDate(p.signedBAt) : '— нет'}</span></div>
  </div>`);
}
