import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFile, writeFile } from 'node:fs/promises';

const ROOT = '/Users/odya/Documents/projects/sos24_claude';
const TPL = `${ROOT}/assets/europrotocol/evroprotokol-uz-template.pdf`;
const MAP = `${ROOT}/assets/europrotocol/fieldmap.draft.json`;
const FONT = `${ROOT}/node_modules/.pnpm/@expo-google-fonts+manrope@0.4.2/node_modules/@expo-google-fonts/manrope/400Regular/Manrope_400Regular.ttf`;
const OUT = `${ROOT}/assets/europrotocol/calibration/testfill.pdf`;

const fm = JSON.parse(await readFile(MAP, 'utf8'));
const doc = await PDFDocument.load(await readFile(TPL));
doc.registerFontkit(fontkit);
const font = await doc.embedFont(await readFile(FONT), { subset: false });
const pages = doc.getPages();

const INK = rgb(0.05, 0.1, 0.55);   // тест-чернила (синие — видно поверх скана)
const RED = rgb(0.85, 0.1, 0.1);

// безопасный текст: если глиф отсутствует в шрифте — заменяем на '?'
function safe(text) {
  let out = '';
  for (const ch of String(text)) {
    try { font.widthOfTextAtSize(ch, 8); out += ch; }
    catch { out += '?'; }
  }
  return out;
}
function T(page, text, x, y, size = 8, color = INK) {
  if (text == null || text === '') return;
  page.drawText(safe(text), { x, y, size, font, color });
}
function comb(page, text, x, y, pitch, cells, size = 9) {
  const s = String(text ?? '').slice(0, cells);
  for (let i = 0; i < s.length; i++) T(page, s[i], x + i * pitch + 2, y, size);
}
function check(page, x, y) { page.drawText('X', { x, y, size: 10, font, color: RED }); }
function guide(page, r, label) {
  page.drawRectangle({ x: r.x, y: r.y, width: r.w, height: r.h, borderColor: RED, borderWidth: 0.8, opacity: 0 });
  T(page, label, r.x + 2, r.y + r.h - 9, 6, RED);
}

// ── Тестовые данные ──
const A = {
  make_model: 'CHEVROLET COBALT', body_no: 'XWBJA69VEMA232808', engine_no: 'F16D47654321',
  regcert_seria: 'AAF', regcert_no: '2949568',
  owner_name: 'КАРИМОВ АЗИЗ ЭРКИНОВИЧ', owner_addr: 'Тошкент, Навоий 12',
  driver_name: 'КАРИМОВ АЗИЗ ЭРКИНОВИЧ', driver_birth: '14051990', driver_addr: 'Тошкент, Навоий 12',
  phone: '998993286330', dl_seria: 'AB', dl_no: '2345678', dl_issue: '12032018',
  ownership_doc: 'Техпаспорт', insurer: 'SOS24 Sugurta', policy_seria: 'OSG', policy_no: '1234567',
  policy_valid: '31122026', damage_desc: 'Передний бампер, левое крыло', objections: 'yoq',
};
const B = {
  make_model: 'DAEWOO NEXIA', body_no: 'XWB3K12A45M001122', engine_no: 'A15SMS998877',
  regcert_seria: 'AAG', regcert_no: '7766554',
  owner_name: 'PETROV IVAN', owner_addr: 'Toshkent, Amir Temur 5',
  driver_name: 'PETROV IVAN', driver_birth: '02021985', driver_addr: 'Toshkent, Amir Temur 5',
  phone: '998901112233', dl_seria: 'AC', dl_no: '1122334', dl_issue: '05052015',
  ownership_doc: 'Texpasport', insurer: 'Kafolat', policy_seria: 'OSG', policy_no: '7654321',
  policy_valid: '30062026', damage_desc: 'Задний бампер', objections: 'yoq',
};
const COMMON = {
  place: 'Тошкент ш., Навоий кўч., 12', date: '10062026', time: '1430', damaged_count: '2',
  med_check: 'yes', witnesses: 'GUVOH: SAIDOV B.', official_check: 'no', service_no: '',
};

const p0 = pages[0];

// 1) общая часть
for (const f of fm.page0_common) {
  if (f.type === 'text') T(p0, COMMON[f.id], f.x, f.y, f.size ?? 8);
  else if (f.type === 'comb') comb(p0, COMMON[f.id], f.x, f.y, f.pitch, f.cells, f.size ?? 9);
  else if (f.type === 'checkbox') {
    const opt = f.options.find((o) => o.value === COMMON[f.id]);
    if (opt) check(p0, opt.x, opt.y);
  }
}

// 2) блок сторон A и B (B = A.x + 336)
const DX = 336;
for (const col of [{ data: A, dx: 0 }, { data: B, dx: DX }]) {
  for (const r of fm.partyBlockTemplate.rows) {
    const x = (r.x ?? 17) + col.dx;
    const y = r.yA;
    const v = col.data[r.id];
    if (r.type === 'text') T(p0, v, x, y, 8);
    else if (r.type === 'comb') comb(p0, v, x, y, r.pitch, r.cells);
    else if (r.type === 'checkbox') {
      // kasko = no
      const opt = r.options.find((o) => o.value === 'no');
      if (opt) check(p0, opt.x + col.dx, opt.y);
    } else if (r.type === 'marks') {
      // категория B
      const lx = r.options['B'];
      if (lx != null) page0Circle(p0, lx + col.dx, r.yA);
    } else if (r.type === 'image') {
      const rc = { ...r.rectA, x: r.rectA.x + col.dx };
      guide(p0, rc, r.id);
    }
  }
}
function page0Circle(page, x, y) { page.drawText('O', { x: x - 2, y: y - 2, size: 11, font, color: RED }); }

// 3) обстоятельства: A=#6, B=#7
const C = fm.page0_circumstances;
function circY(n) { return C.rowYStart + (n - 1) * C.rowPitch; }
check(p0, C.aCheckX, circY(6));
check(p0, C.bCheckX, circY(7));
comb(p0, '1', C.checkedCountBox.x, C.checkedCountBox.y, C.checkedCountBox.pitch, C.checkedCountBox.cells);

// 4) схема + подписи
for (const f of fm.page0_schema) guide(p0, f.rect, f.id);

// 5) оборотная сторона
const p1 = pages[1];
for (const f of fm.page1_back) {
  if (f.type === 'text') T(p1, f.id === 'circumstances_text' ? 'Менинг машинам тўғрига кетаётган эди...' : 'yoq', f.x, f.y, 8);
  else if (f.type === 'checkbox') { const o = f.options.find((o) => o.value === 'yes'); if (o) check(p1, o.x, o.y); }
  else if (f.type === 'image') guide(p1, f.rect, f.id);
}

await writeFile(OUT, await doc.save());
console.log('testfill written:', OUT);
