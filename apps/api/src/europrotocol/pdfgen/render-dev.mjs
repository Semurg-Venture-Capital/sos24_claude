// Dev-рендерер бланка Европротокола: Handlebars + Puppeteer → PDF.
// Запуск из apps/api:  node src/europrotocol/pdf/render-dev.mjs [out.pdf] [--blank]
// --blank → пустой бланк (без sample-данных), для сверки геометрии с оригиналом.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const blank = process.argv.includes('--blank');
const out = process.argv.find((a) => a.endsWith('.pdf')) || '/tmp/euro-dev.pdf';

// ── Хелперы ──
Handlebars.registerHelper('comb', (value, cells) => {
  const n = Number(cells) || 0;
  const chars = String(value ?? '').slice(0, n).split('');
  let html = '<span class="comb">';
  for (let i = 0; i < n; i++) html += `<span class="cell">${chars[i] ?? ''}</span>`;
  html += '</span>';
  return new Handlebars.SafeString(html);
});
Handlebars.registerHelper('on', (v, expected) => (v === expected ? 'on' : ''));
Handlebars.registerHelper('onb', (v) => (v ? 'on' : ''));
Handlebars.registerHelper('inc', (i) => Number(i) + 1);

Handlebars.registerPartial('partyBlock', readFileSync(join(__dirname, 'partyBlock.hbs'), 'utf8'));
const template = Handlebars.compile(readFileSync(join(__dirname, 'template.hbs'), 'utf8'));

// ── Текст 22 обстоятельств ──
const CIRC = [
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

const sampleParty = (side) => ({
  side,
  makeModel: side === 'А' ? 'Chevrolet Cobalt, 2021' : 'Daewoo Nexia, 2014',
  bodyNo: side === 'А' ? 'KL1J5611EAB123456' : 'XWB3L32CDE0987654',
  engineNo: side === 'А' ? 'B12D1234567' : 'A15SMS7654321',
  regStateNo: side === 'А' ? '01A123BC' : '30B456CD',
  regCertSeria: 'AAF',
  regCertNo: '1234567',
  ownerName: side === 'А' ? 'Каримов Азиз Botirovich' : 'Юсупов Шерзод Akmalovich',
  ownerAddr: side === 'А' ? 'Тошкент ш., Чилонзор, 12-32' : 'Тошкент ш., Юнусобод, 4-7',
  driverName: side === 'А' ? 'Каримов Азиз Ботирович' : 'Юсупов Шерзод Акмалович',
  driverBirth: '15081990',
  driverAddr: side === 'А' ? 'Тошкент ш., Чилонзор, 12-32' : 'Тошкент ш., Юнусобод, 4-7',
  phone: side === 'А' ? '901234567' : '935554433',
  dlSeria: 'AC',
  dlNo: '1234567',
  dlIssue: '01032019',
  ownershipDoc: '—',
  insurer: side === 'А' ? 'SOS24 Sugʻurta' : 'Apex Insurance',
  policySeria: 'AAA',
  policyNo: '7654321',
  policyValid: '31122026',
  kasko: side === 'А' ? 'no' : 'no',
  damageDesc: side === 'А' ? 'Олд бампер, ўнг фара, капот' : 'Орқа бампер, юк хонаси қопқоғи',
  objections: '',
});

const data = blank
  ? {
      common: {},
      parties: { a: { side: 'А' }, b: { side: 'В' } },
      circumstances: CIRC.map((text) => ({ text, a: false, b: false })),
      counts: { a: '', b: '' },
    }
  : {
      common: {
        place: 'Тошкент ш., Амир Темур кўчаси, 15',
        date: '15062026',
        time: '1430',
        damagedCount: '2',
        medCheck: 'yes',
        witnesses: 'Олимов Ж. — 90 111 22 33',
        official: 'no',
        serviceNo: '',
      },
      parties: { a: sampleParty('А'), b: sampleParty('В') },
      circumstances: CIRC.map((text, i) => ({ text, a: i === 6, b: i === 9 })),
      counts: { a: '1', b: '1' },
    };

const html = template(data);

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'networkidle0' });
await page.pdf({ path: out, format: 'A4', printBackground: true });
await browser.close();
console.log('PDF →', out, blank ? '(blank)' : '(sample)');
