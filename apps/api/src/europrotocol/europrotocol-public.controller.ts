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
<title>SOS24 — проверка европротокола</title>
<style>
  *{box-sizing:border-box} body{margin:0;font-family:-apple-system,Segoe UI,Roboto,Inter,sans-serif;background:#f4f4f5;color:#151515}
  .wrap{max-width:520px;margin:0 auto;padding:24px 16px}
  .brand{display:flex;align-items:center;gap:8px;font-weight:800;font-size:20px;margin-bottom:16px}
  .brand .dot{width:12px;height:12px;border-radius:50%;background:#e61428}
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
  <div class="brand"><span class="dot"></span>SOS24</div>
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
