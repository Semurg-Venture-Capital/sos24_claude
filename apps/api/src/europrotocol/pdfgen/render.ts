// Рендер бланка Европротокола: Handlebars-шаблон → PDF (headless Chromium).
// Шаблоны (template.hbs, partyBlock.hbs) лежат рядом и копируются в dist через
// nest-cli assets. Браузер — ленивый синглтон (переиспользуется между запросами).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Handlebars from 'handlebars';
import puppeteer, { type Browser } from 'puppeteer';

// ── Текст 22 обстоятельств ДТП (центральная таблица бланка) ──
export const CIRCUMSTANCES: string[] = [
  'Т/в автотураргоҳ, тўхташ жойи, йўл чети ва бошқаларда ҳаракатсиз ҳолатда турган',
  'Ҳайдовчи ЙТҲ жойида бўлмаган',
  'Автотураргоҳда ҳаракатланган',
  'Автотураргоҳдан, тўхтаб туриш жойидан, тўхташ жойидан, ховлидан, иккинчи даражали йўлдан ҳаракатланиб чиққан',
  'Автотураргоҳга, тўхташ жойига, ховлига, иккинчи даражали йўлга ҳаракатланиб кирган',
  'Тўғрига ҳаракатланган (манёвр қилмаган)',
  'Чорраҳада ҳаракатланган',
  'Айланма ҳаракатли чорраҳага чиққан',
  'Айланма ҳаракатли чорраҳа бўйлаб ҳаракатланган',
  'Бир хил йўналишда бир қаторда ҳаракатланган т/в билан тўқнашган',
  'Бир йўналишда ҳаракатланиб бошқа бўлакдаги т/в билан тўқнашган (бошқа қаторда)',
  'Ҳаракат йўналишини ўзгартирган (бошқа бўлакка тизилиш)',
  'Қувиб ўтган',
  'Ўнгга бурилган',
  'Чапга бурилган',
  'Бурилишни амалга оширган (қайрилиб олиш)',
  'Орқага ҳаракатланган',
  'Йўлнинг қарама-қарши ҳаракатланиш бўлагига чиққан',
  'Иккинчи (тўқнашган) т/в чап томонимда бўлган',
  'Имтиёз белгиларга амал қилмаган',
  'Тўхтаган ёки тўхтаб турган т/вга тўқнашув содир этган (урилиш)',
  'Светофорнинг тақиқловчи ишорасига тўхтаган (турган) т/вга тўқнашув содир этган',
];

// ── Типы данных шаблона ──
export interface EuroPartyData {
  side: 'А' | 'В';
  makeModel?: string;
  bodyNo?: string;
  engineNo?: string;
  regStateNo?: string;
  regCertSeria?: string;
  regCertNo?: string;
  ownerName?: string;
  ownerAddr?: string;
  driverName?: string;
  driverBirth?: string; // DDMMYYYY
  driverAddr?: string;
  phone?: string;
  dlSeria?: string;
  dlNo?: string;
  dlIssue?: string; // DDMMYYYY
  ownershipDoc?: string;
  insurer?: string;
  policySeria?: string;
  policyNo?: string;
  policyValid?: string; // DDMMYYYY
  kasko?: 'yes' | 'no' | '';
  damageDesc?: string;
  objections?: string;
  impactImg?: string;
  impactZone?: string; // текстовая зона первого удара (если нет картинки)
  signImg?: string;
  signStamp?: string; // текстовый штамп подписи (OTP/MyID), если нет картинки
}

export interface EuroSignRow {
  day?: string;
  month?: string;
  year?: string;
  signature?: string; // текст в графе «имзо» (штамп OTP/MyID)
  fio?: string;
}

export interface EuroPdfData {
  common: {
    place?: string;
    date?: string; // DDMMYYYY
    time?: string; // HHMM
    damagedCount?: string;
    medCheck?: 'yes' | 'no' | '';
    witnesses?: string;
    official?: 'yes' | 'no' | '';
    serviceNo?: string;
  };
  parties: { a: EuroPartyData; b: EuroPartyData };
  circumstances: Array<{ text: string; a: boolean; b: boolean }>;
  counts: { a: string; b: string };
  schemeImg?: string;
  qrDataUrl?: string; // data-URI QR-кода (картинка)
  qrUrl?: string; // текстовая ссылка проверки (api.sos24.uz/p/<token>)
  signA?: string;
  signB?: string;
  back: {
    circumstancesText?: string;
    driverRole?: 'owner' | 'other' | '';
    canMove?: 'yes' | 'no' | '';
    cannotMovePlace?: string;
    remarks?: string;
    signRows: EuroSignRow[];
  };
}

// ── Handlebars: хелперы + шаблон (компилируется один раз) ──
let compiled: Handlebars.TemplateDelegate | null = null;

function getTemplate(): Handlebars.TemplateDelegate {
  if (compiled) return compiled;

  Handlebars.registerHelper('comb', (value: unknown, cells: unknown) => {
    const n = Number(cells) || 0;
    const chars = String(value ?? '').slice(0, n).split('');
    let html = '<span class="comb">';
    for (let i = 0; i < n; i++) html += `<span class="cell">${escapeHtml(chars[i] ?? '')}</span>`;
    html += '</span>';
    return new Handlebars.SafeString(html);
  });
  Handlebars.registerHelper('on', (v: unknown, expected: unknown) => (v === expected ? 'on' : ''));
  Handlebars.registerHelper('onb', (v: unknown) => (v ? 'on' : ''));
  Handlebars.registerHelper('inc', (i: unknown) => Number(i) + 1);

  Handlebars.registerPartial('partyBlock', readFileSync(join(__dirname, 'partyBlock.hbs'), 'utf8'));
  compiled = Handlebars.compile(readFileSync(join(__dirname, 'template.hbs'), 'utf8'));
  return compiled;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

// ── Браузер (ленивый синглтон) ──
let browserPromise: Promise<Browser> | null = null;

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    // В проде (Docker) — системный Chromium из PUPPETEER_EXECUTABLE_PATH;
    // локально — бандл Puppeteer (executablePath undefined → дефолт).
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
    browserPromise = puppeteer.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserPromise;
}

export async function closeBrowser(): Promise<void> {
  if (browserPromise) {
    const b = await browserPromise;
    await b.close();
    browserPromise = null;
  }
}

// ── Главная функция: данные → PDF Buffer ──
export async function renderEuroPdf(data: EuroPdfData): Promise<Buffer> {
  const html = getTemplate()(data);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}
