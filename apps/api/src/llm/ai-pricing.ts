// Тарифы Gemini (USD за 1M токенов) — для оценки расходов в AI-логе.
// dev и прод работают на ПЛАТНЫХ токенах, поэтому это реальные расходы (с округлением ставок).
// Обновлять при смене модели/цен. Источник — прайс Google AI (Gemini API).

export interface TokenRate {
  input: number; // USD за 1M входных токенов
  output: number; // USD за 1M выходных токенов
}

// Порядок важен: 'flash-lite' раньше 'flash' (иначе flash-lite попадёт под flash).
const RATES: { match: string; rate: TokenRate }[] = [
  { match: 'flash-lite', rate: { input: 0.1, output: 0.4 } },
  { match: 'flash', rate: { input: 0.3, output: 2.5 } },
  { match: 'pro', rate: { input: 1.25, output: 10.0 } },
];
const DEFAULT_RATE: TokenRate = { input: 0.1, output: 0.4 };

export function rateFor(model: string): TokenRate {
  const m = (model ?? '').toLowerCase();
  return RATES.find((r) => m.includes(r.match))?.rate ?? DEFAULT_RATE;
}

// Стоимость одного вызова в USD по разбивке вход/выход.
export function estimateCostUsd(model: string, promptTokens: number, outputTokens: number): number {
  const r = rateFor(model);
  return (promptTokens / 1_000_000) * r.input + (outputTokens / 1_000_000) * r.output;
}
