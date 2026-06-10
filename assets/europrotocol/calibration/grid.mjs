import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFile, writeFile } from 'node:fs/promises';

const SRC = '/Users/odya/Documents/projects/sos24_claude/assets/europrotocol/evroprotokol-uz-template.pdf';
const OUT = '/Users/odya/Documents/projects/sos24_claude/assets/europrotocol/calibration/grid.pdf';

const doc = await PDFDocument.load(await readFile(SRC));
const font = await doc.embedFont(StandardFonts.Helvetica);

const STEP = 25;        // тонкая сетка, pt
const MAJOR = 100;      // жирная линия + подпись, pt
const LABEL = 50;       // шаг подписей, pt

for (const page of doc.getPages()) {
  const { width, height } = page.getSize();

  // вертикальные линии
  for (let x = 0; x <= width; x += STEP) {
    const major = x % MAJOR === 0;
    page.drawLine({
      start: { x, y: 0 },
      end: { x, y: height },
      thickness: major ? 0.6 : 0.25,
      color: major ? rgb(0.85, 0.1, 0.1) : rgb(0.45, 0.65, 0.95),
      opacity: major ? 0.55 : 0.35,
    });
    if (x % LABEL === 0) {
      for (const yy of [height - 10, 4]) {
        page.drawText(String(x), { x: x + 1, y: yy, size: 6, font, color: rgb(0.8, 0.05, 0.05) });
      }
    }
  }
  // горизонтальные линии
  for (let y = 0; y <= height; y += STEP) {
    const major = y % MAJOR === 0;
    page.drawLine({
      start: { x: 0, y },
      end: { x: width, y },
      thickness: major ? 0.6 : 0.25,
      color: major ? rgb(0.85, 0.1, 0.1) : rgb(0.45, 0.65, 0.95),
      opacity: major ? 0.55 : 0.35,
    });
    if (y % LABEL === 0) {
      for (const xx of [2, width - 18]) {
        page.drawText(String(y), { x: xx, y: y + 1, size: 6, font, color: rgb(0.8, 0.05, 0.05) });
      }
    }
  }
}

await writeFile(OUT, await doc.save());
console.log('grid written:', OUT);
