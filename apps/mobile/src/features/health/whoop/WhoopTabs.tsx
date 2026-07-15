import { Text, View } from 'react-native';
import { tokens } from '../../../theme/colors';
import { type WhoopMetrics, useWhoopHistory, type WhoopMetric } from '../../../api/wearables';
import { GlassCard, RecoveryRing, StageBar, StrainArc, Tile, TrendLine, Sparkline, W, recoveryColor } from './WhoopCharts';

const fmt = (n: number | null | undefined, d = 0) => (n != null ? n.toFixed(d) : '—');
const hm = (min: number | null | undefined) => (min != null ? `${Math.floor(min / 60)}ч ${String(min % 60).padStart(2, '0')}м` : '—');
const readyLabel = (s: number | null | undefined) => (s == null ? '' : s >= 67 ? 'Высокая готовность' : s >= 34 ? 'Средняя готовность' : 'Низкая готовность');

const Lbl = ({ children }: { children: string }) => (
  <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 10.5, letterSpacing: 0.6, textTransform: 'uppercase', color: tokens.inkMuted }}>{children}</Text>
);
const Note = ({ children }: { children: string }) => (
  <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12.5, lineHeight: 18, color: tokens.inkMuted }}>{children}</Text>
);

function useSpark(metric: WhoopMetric) {
  const { data } = useWhoopHistory(metric, 14);
  return (data?.points ?? []).map((p) => p.value);
}

// ── Обзор ──
export function WhoopOverviewTab({ m }: { m: WhoopMetrics }) {
  const rec = m.recovery.score;
  const hrvSpark = useSpark('hrv');
  const rhrSpark = useSpark('rhr');
  const stages = [
    { label: 'Глубокий', min: m.sleep.stages.deepMin ?? 0, color: W.sleep },
    { label: 'REM', min: m.sleep.stages.remMin ?? 0, color: W.sleepRem },
    { label: 'Лёгкий', min: m.sleep.stages.lightMin ?? 0, color: W.sleepLight },
    { label: 'Бодрст.', min: m.sleep.stages.awakeMin ?? 0, color: tokens.hairline },
  ];
  return (
    <View style={{ gap: 14 }}>
      <GlassCard style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <RecoveryRing score={rec ?? null} size={112} />
        <View style={{ flex: 1, gap: 6 }}>
          <Lbl>Восстановление</Lbl>
          <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 18, letterSpacing: -0.3, color: recoveryColor(rec) }}>{readyLabel(rec)}</Text>
          <Note>Насколько организм восстановился и готов к нагрузке — по ВСР, пульсу покоя и сну за ночь.</Note>
        </View>
      </GlassCard>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <GlassCard style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}>
          <Lbl>Нагрузка</Lbl>
          <StrainArc value={m.cycle.strain ?? null} size={116} />
        </GlassCard>
        <GlassCard style={{ flex: 1 }}>
          <Lbl>Сон</Lbl>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 4 }}>
            <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 30, color: W.sleep }}>{fmt(m.sleep.performance)}</Text>
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: tokens.inkMuted }}>%</Text>
          </View>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>{hm(m.sleep.totalMinutes)}</Text>
          <View style={{ marginTop: 12 }}>
            <StageBar segs={stages} />
          </View>
        </GlassCard>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Tile label="ВСР" value={fmt(m.recovery.hrvMs)} unit="мс" color={W.hrv} spark={hrvSpark} />
        <Tile label="Пульс покоя" value={fmt(m.recovery.restingHr)} unit="уд/м" color={W.rhr} spark={rhrSpark} />
      </View>
    </View>
  );
}

// ── Восстановление ──
export function WhoopRecoveryTab({ m }: { m: WhoopMetrics }) {
  const rec = m.recovery.score;
  const hrvSpark = useSpark('hrv');
  const rhrSpark = useSpark('rhr');
  return (
    <View style={{ gap: 14 }}>
      <GlassCard style={{ alignItems: 'center', gap: 10, paddingVertical: 22 }}>
        <RecoveryRing score={rec ?? null} size={168} label={readyLabel(rec)} />
        <Note>Восстановление считается по вариабельности сердечного ритма (ВСР), пульсу покоя, качеству сна и дыханию за ночь.</Note>
      </GlassCard>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Tile label="ВСР" value={fmt(m.recovery.hrvMs)} unit="мс" color={W.hrv} spark={hrvSpark} />
        <Tile label="Пульс покоя" value={fmt(m.recovery.restingHr)} unit="уд/м" color={W.rhr} spark={rhrSpark} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Tile label="Кислород" value={fmt(m.recovery.spo2, 1)} unit="%" color={W.resp} />
        <Tile label="Темп. кожи" value={fmt(m.recovery.skinTempC, 1)} unit="°C" color={W.recMid} />
      </View>
    </View>
  );
}

// ── Сон ──
export function WhoopSleepTab({ m }: { m: WhoopMetrics }) {
  const stages = [
    { label: 'Глубокий', min: m.sleep.stages.deepMin ?? 0, color: W.sleep },
    { label: 'REM', min: m.sleep.stages.remMin ?? 0, color: W.sleepRem },
    { label: 'Лёгкий', min: m.sleep.stages.lightMin ?? 0, color: W.sleepLight },
    { label: 'Бодрствование', min: m.sleep.stages.awakeMin ?? 0, color: tokens.hairline },
  ];
  return (
    <View style={{ gap: 14 }}>
      <GlassCard>
        <Lbl>Качество сна</Lbl>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
          <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 44, letterSpacing: -1, color: W.sleep }}>{fmt(m.sleep.performance)}</Text>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 18, color: tokens.inkMuted }}>%</Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted, marginLeft: 'auto' }}>{hm(m.sleep.totalMinutes)}</Text>
        </View>
      </GlassCard>
      <GlassCard>
        <Lbl>Фазы сна</Lbl>
        <View style={{ marginTop: 12 }}>
          <StageBar segs={stages} />
        </View>
        <View style={{ marginTop: 12 }}>
          <Note>Глубокий сон восстанавливает тело, REM — мозг и память. Чем больше глубокого и REM, тем лучше восстановление.</Note>
        </View>
      </GlassCard>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Tile label="Дыхание" value={fmt(m.sleep.respiratoryRate, 1)} unit="вд/м" color={W.resp} />
        <Tile label="Всего сна" value={hm(m.sleep.totalMinutes)} />
      </View>
    </View>
  );
}

// ── Нагрузка ──
export function WhoopStrainTab({ m }: { m: WhoopMetrics }) {
  return (
    <View style={{ gap: 14 }}>
      <GlassCard style={{ alignItems: 'center', paddingVertical: 18 }}>
        <Lbl>Дневная нагрузка</Lbl>
        <StrainArc value={m.cycle.strain ?? null} size={178} />
        <View style={{ marginTop: 4 }}>
          <Note>Суммарная нагрузка на сердце за день (0–21). Сравнивайте с восстановлением: высокая готовность → можно нагружаться сильнее.</Note>
        </View>
      </GlassCard>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Tile label="Ср. пульс" value={fmt(m.cycle.avgHr)} unit="уд/м" color={W.rhr} />
        <Tile label="Макс. пульс" value={fmt(m.cycle.maxHr)} unit="уд/м" color={tokens.red} />
      </View>
    </View>
  );
}

// ── Тренды ──
const RANGES: (14 | 30 | 90)[] = [14, 30, 90];
export function WhoopTrendsTab({ range, onRange }: { range: 14 | 30 | 90; onRange: (r: 14 | 30 | 90) => void }) {
  const rec = useWhoopHistory('recovery', range);
  const hrv = useWhoopHistory('hrv', range);
  const rhr = useWhoopHistory('rhr', range);
  const sleep = useWhoopHistory('sleep', range);

  const card = (title: string, q: ReturnType<typeof useWhoopHistory>, color: string, unit: string) => {
    const pts = (q.data?.points ?? []).map((p) => p.value);
    const cur = pts.length ? pts[pts.length - 1] : null;
    const first = pts.length ? pts[0] : null;
    const delta = cur != null && first != null ? Math.round((cur - first) * 10) / 10 : null;
    return (
      <GlassCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 14, color: tokens.ink }}>{title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 20, color }}>{cur != null ? fmt(cur, unit === 'мс' && cur % 1 !== 0 ? 0 : 0) : '—'}<Text style={{ fontSize: 12, color: tokens.inkMuted }}>{unit}</Text></Text>
            {delta != null ? (
              <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 11, color: delta >= 0 ? W.recHi : W.rhr }}>{delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}</Text>
            ) : null}
          </View>
        </View>
        <View style={{ marginTop: 8 }}>
          <TrendLine data={pts} color={color} width={280} height={72} />
        </View>
      </GlassCard>
    );
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'center' }}>
        {RANGES.map((r) => (
          <Text
            key={r}
            onPress={() => onRange(r)}
            style={{
              fontFamily: 'Manrope_700Bold', fontSize: 12.5, color: r === range ? '#fff' : tokens.inkDark,
              backgroundColor: r === range ? tokens.inkDark : tokens.glass,
              paddingVertical: 7, paddingHorizontal: 16, borderRadius: 999, overflow: 'hidden',
            }}
          >
            {r} дней
          </Text>
        ))}
      </View>
      {card('Восстановление', rec, recoveryColor(rec.data?.points?.at(-1)?.value ?? null), '%')}
      {card('ВСР (ночью)', hrv, W.hrv, ' мс')}
      {card('Пульс покоя', rhr, W.rhr, ' уд/м')}
      {card('Сон', sleep, W.sleep, '%')}
    </View>
  );
}
