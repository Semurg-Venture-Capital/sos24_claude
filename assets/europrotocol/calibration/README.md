# Калибровка автозаполнения бланка Европротокола

Песочница (одноразовая): `npm i pdf-lib @pdf-lib/fontkit` (см. /tmp/evrocal или перенести в apps/api).

## Скрипты
- `grid.mjs` — рисует координатную сетку (pt, origin внизу-слева) → `grid.pdf`.
- `testfill.mjs` — заполняет бланк тест-данными по `../fieldmap.draft.json` → `testfill.pdf`.

## Цикл калибровки
1. `node testfill.mjs` → `testfill.pdf`
2. `pdftoppm -png -r 150 testfill.pdf testfill-full` → сравнить с бланком
3. Подвинуть координаты/pitch в `fieldmap.draft.json`, повторить
4. При попадании — `calibrated: true`, перенести карту в генератор (apps/api)

Шрифт: Manrope TTF (есть кириллица). Встраивается через fontkit.
