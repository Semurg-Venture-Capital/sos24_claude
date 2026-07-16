import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { tokens } from '../../../theme/colors';
import { type WhoopMetrics, useWhoopHistory, type WhoopMetric } from '../../../api/wearables';
import { GlassCard, HrZones, RecoveryRing, StageBar, StrainArc, Tile, TrendLine, W, recoveryColor } from './WhoopCharts';

const fmt = (n: number | null | undefined, d = 0) => (n != null ? n.toFixed(d) : '—');
const hm = (min: number | null | undefined, t: TFunction) =>
  min != null ? `${Math.floor(min / 60)}${t('healthCard.units.hourShort')} ${String(min % 60).padStart(2, '0')}${t('healthCard.units.minuteShort')}` : '—';
const readyLabel = (s: number | null | undefined, t: TFunction) =>
  s == null ? '' : s >= 67 ? t('healthCard.whoop.ready.high') : s >= 34 ? t('healthCard.whoop.ready.mid') : t('healthCard.whoop.ready.low');

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
  const { t } = useTranslation();
  const rec = m.recovery.score;
  const hrvSpark = useSpark('hrv');
  const rhrSpark = useSpark('rhr');
  const stages = [
    { label: t('healthCard.whoop.stage.deep'), min: m.sleep.stages.deepMin ?? 0, color: W.sleep },
    { label: 'REM', min: m.sleep.stages.remMin ?? 0, color: W.sleepRem },
    { label: t('healthCard.whoop.stage.light'), min: m.sleep.stages.lightMin ?? 0, color: W.sleepLight },
    { label: t('healthCard.whoop.stage.awakeShort'), min: m.sleep.stages.awakeMin ?? 0, color: tokens.hairline },
  ];
  return (
    <View style={{ gap: 14 }}>
      <GlassCard style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <RecoveryRing score={rec ?? null} size={112} />
        <View style={{ flex: 1, gap: 6 }}>
          <Lbl>{t('healthCard.whoop.recovery')}</Lbl>
          <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 18, letterSpacing: -0.3, color: recoveryColor(rec) }}>{readyLabel(rec, t)}</Text>
          <Note>{t('healthCard.whoop.overviewRecoveryNote')}</Note>
        </View>
      </GlassCard>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <GlassCard style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}>
          <Lbl>{t('healthCard.whoop.strain')}</Lbl>
          <StrainArc value={m.cycle.strain ?? null} size={116} />
        </GlassCard>
        <GlassCard style={{ flex: 1 }}>
          <Lbl>{t('healthCard.whoop.sleep')}</Lbl>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 4 }}>
            <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 30, color: W.sleep }}>{fmt(m.sleep.performance)}</Text>
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: tokens.inkMuted }}>%</Text>
          </View>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>{hm(m.sleep.totalMinutes, t)}</Text>
          <View style={{ marginTop: 12 }}>
            <StageBar segs={stages} />
          </View>
        </GlassCard>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Tile label={t('healthCard.whoop.hrv')} value={fmt(m.recovery.hrvMs)} unit={t('healthCard.units.ms')} color={W.hrv} spark={hrvSpark} />
        <Tile label={t('healthCard.whoop.restingHr')} value={fmt(m.recovery.restingHr)} unit={t('healthCard.units.bpm')} color={W.rhr} spark={rhrSpark} />
      </View>
    </View>
  );
}

// ── Восстановление ──
export function WhoopRecoveryTab({ m }: { m: WhoopMetrics }) {
  const { t } = useTranslation();
  const rec = m.recovery.score;
  const hrvSpark = useSpark('hrv');
  const rhrSpark = useSpark('rhr');
  return (
    <View style={{ gap: 14 }}>
      <GlassCard style={{ alignItems: 'center', gap: 10, paddingVertical: 22 }}>
        <RecoveryRing score={rec ?? null} size={168} label={readyLabel(rec, t)} />
        <Note>{t('healthCard.whoop.recoveryNote')}</Note>
      </GlassCard>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Tile label={t('healthCard.whoop.hrv')} value={fmt(m.recovery.hrvMs)} unit={t('healthCard.units.ms')} color={W.hrv} spark={hrvSpark} />
        <Tile label={t('healthCard.whoop.restingHr')} value={fmt(m.recovery.restingHr)} unit={t('healthCard.units.bpm')} color={W.rhr} spark={rhrSpark} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Tile label={t('healthCard.whoop.oxygen')} value={fmt(m.recovery.spo2, 1)} unit="%" color={W.resp} />
        <Tile label={t('healthCard.whoop.skinTemp')} value={fmt(m.recovery.skinTempC, 1)} unit="°C" color={W.recMid} />
      </View>
    </View>
  );
}

// ── Сон ──
export function WhoopSleepTab({ m }: { m: WhoopMetrics }) {
  const { t } = useTranslation();
  const stages = [
    { label: t('healthCard.whoop.stage.deep'), min: m.sleep.stages.deepMin ?? 0, color: W.sleep },
    { label: 'REM', min: m.sleep.stages.remMin ?? 0, color: W.sleepRem },
    { label: t('healthCard.whoop.stage.light'), min: m.sleep.stages.lightMin ?? 0, color: W.sleepLight },
    { label: t('healthCard.whoop.stage.awake'), min: m.sleep.stages.awakeMin ?? 0, color: tokens.hairline },
  ];
  const need = m.sleep.needMinutes;
  const got = m.sleep.totalMinutes;
  const gotPct = need && got ? Math.min(100, Math.round((got / need) * 100)) : null;
  const debt = need && got && need > got ? need - got : null;
  return (
    <View style={{ gap: 14 }}>
      <GlassCard>
        <Lbl>{t('healthCard.whoop.sleepQuality')}</Lbl>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
          <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 44, letterSpacing: -1, color: W.sleep }}>{fmt(m.sleep.performance)}</Text>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 18, color: tokens.inkMuted }}>%</Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted, marginLeft: 'auto' }}>
            {hm(got, t)}{need ? ` / ${hm(need, t)}` : ''}
          </Text>
        </View>
        {gotPct != null ? (
          <View style={{ marginTop: 12 }}>
            <View style={{ height: 10, borderRadius: 999, backgroundColor: tokens.hairline, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${gotPct}%`, backgroundColor: W.sleep, borderRadius: 999 }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
              <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 10.5, color: tokens.inkMuted }}>{t('healthCard.whoop.gotPct', { pct: gotPct })}</Text>
              {debt != null ? <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 10.5, color: tokens.inkMuted }}>{t('healthCard.whoop.debt', { value: hm(debt, t) })}</Text> : null}
            </View>
          </View>
        ) : null}
      </GlassCard>
      <GlassCard>
        <Lbl>{t('healthCard.whoop.sleepStages')}</Lbl>
        <View style={{ marginTop: 12 }}>
          <StageBar segs={stages} />
        </View>
        <View style={{ marginTop: 12 }}>
          <Note>{t('healthCard.whoop.sleepStagesNote')}</Note>
        </View>
      </GlassCard>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Tile label={t('healthCard.whoop.consistency')} value={fmt(m.sleep.consistency)} unit="%" color={W.sleep} />
        <Tile label={t('healthCard.whoop.efficiency')} value={fmt(m.sleep.efficiency)} unit="%" color={W.hrv} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Tile label={t('healthCard.whoop.respiration')} value={fmt(m.sleep.respiratoryRate, 1)} unit={t('healthCard.units.brpm')} color={W.resp} />
        <Tile label={t('healthCard.whoop.totalSleep')} value={hm(got, t)} />
      </View>
    </View>
  );
}

// ── Нагрузка ──
export function WhoopStrainTab({ m }: { m: WhoopMetrics }) {
  const { t } = useTranslation();
  return (
    <View style={{ gap: 14 }}>
      <GlassCard style={{ alignItems: 'center', paddingVertical: 18 }}>
        <Lbl>{t('healthCard.whoop.dayStrain')}</Lbl>
        <StrainArc value={m.cycle.strain ?? null} size={178} />
        <View style={{ marginTop: 4 }}>
          <Note>{t('healthCard.whoop.strainNote')}</Note>
        </View>
      </GlassCard>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Tile label={t('healthCard.whoop.avgHr')} value={fmt(m.cycle.avgHr)} unit={t('healthCard.units.bpm')} color={W.rhr} />
        <Tile label={t('healthCard.whoop.maxHr')} value={fmt(m.cycle.maxHr)} unit={t('healthCard.units.bpm')} color={tokens.red} />
      </View>
      {m.cycle.calories != null ? (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Tile label={t('healthCard.whoop.calories')} value={m.cycle.calories.toLocaleString('ru-RU')} unit={t('healthCard.units.kcal')} color={W.recMid} />
          <Tile label={t('healthCard.whoop.recovery')} value={fmt(m.recovery.score)} unit="%" color={recoveryColor(m.recovery.score)} />
        </View>
      ) : null}

      {m.zones && m.zones.some((v) => v > 0) ? (
        <GlassCard>
          <Lbl>{t('healthCard.whoop.hrZones')}</Lbl>
          <View style={{ marginTop: 10 }}>
            <HrZones zones={m.zones} />
          </View>
        </GlassCard>
      ) : null}

      {m.workouts && m.workouts.length ? (
        <View style={{ gap: 10 }}>
          <Lbl>{t('healthCard.whoop.workouts')}</Lbl>
          {m.workouts.slice(0, 6).map((w) => (
            <GlassCard key={w.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${W.strain}22`, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 18 }}>🏃</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 14, color: tokens.ink }}>{w.sport ?? t('healthCard.whoop.workout')}</Text>
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>
                  {w.durationMin} {t('healthCard.units.min')}{w.calories != null ? ` · ${w.calories} ${t('healthCard.units.kcal')}` : ''}{w.distanceM != null ? ` · ${(w.distanceM / 1000).toFixed(1)} км` : ''}
                </Text>
              </View>
              {w.strain != null ? <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 20, color: W.strain }}>{w.strain.toFixed(1)}</Text> : null}
            </GlassCard>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ── Тренды ──
const RANGES: (14 | 30 | 90)[] = [14, 30, 90];
export function WhoopTrendsTab({ range, onRange }: { range: 14 | 30 | 90; onRange: (r: 14 | 30 | 90) => void }) {
  const { t } = useTranslation();
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
            <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 20, color }}>{cur != null ? fmt(cur, 0) : '—'}<Text style={{ fontSize: 12, color: tokens.inkMuted }}>{unit}</Text></Text>
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
            {t('healthCard.whoop.days', { count: r })}
          </Text>
        ))}
      </View>
      {card(t('healthCard.whoop.recovery'), rec, recoveryColor(rec.data?.points?.at(-1)?.value ?? null), '%')}
      {card(t('healthCard.whoop.hrvNight'), hrv, W.hrv, ` ${t('healthCard.units.ms')}`)}
      {card(t('healthCard.whoop.restingHr'), rhr, W.rhr, ` ${t('healthCard.units.bpm')}`)}
      {card(t('healthCard.whoop.sleep'), sleep, W.sleep, '%')}
    </View>
  );
}
