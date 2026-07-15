import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';
import { tokens } from '../../../theme/colors';
import { medGlass } from '../components';

// Палитра данных WHOOP (семантические цвета, отдельно от бренд-красного).
export const W = {
  recHi: '#16A34A',
  recMid: '#D9A404',
  recLo: '#E6483A',
  strain: '#3F74FF',
  sleep: '#7B6CF0',
  sleepRem: '#9D8BFF',
  sleepLight: '#C3BCF5',
  hrv: '#0FB5A6',
  rhr: '#F0637C',
  resp: '#3AA0E0',
};
export const recoveryColor = (s: number | null | undefined) =>
  s == null ? tokens.inkMuted : s >= 67 ? W.recHi : s >= 34 ? W.recMid : W.recLo;

const LIQUID = isLiquidGlassAvailable();

// Стеклянная карточка (максимум Liquid Glass; фолбэк — medGlass).
export function GlassCard({ children, style }: { children: ReactNode; style?: object }) {
  if (LIQUID) {
    return (
      <GlassView glassEffectStyle="regular" style={[{ borderRadius: 24, overflow: 'hidden', padding: 16 }, style]}>
        {children}
      </GlassView>
    );
  }
  return <View style={[{ borderRadius: 24, padding: 16 }, medGlass, style]}>{children}</View>;
}

// Кольцо восстановления.
export function RecoveryRing({ score, size = 150, stroke = 13, label }: { score: number | null; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score ?? 0)) / 100;
  const color = recoveryColor(score);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={tokens.hairline} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} />
      </Svg>
      <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: size * 0.3, letterSpacing: -1, color }}>{score ?? '—'}</Text>
      {label ? <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: size * 0.075, color, marginTop: -2 }}>{label}</Text> : null}
    </View>
  );
}

// Дуга-гейдж (нагрузка 0..21), 270°.
export function StrainArc({ value, max = 21, size = 170, color = W.strain }: { value: number | null; max?: number; size?: number; color?: string }) {
  const stroke = 11;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const a0 = Math.PI * 0.75;
  const a1 = Math.PI * 2.25;
  const pt = (a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const seg = (s: number, e: number) => {
    const [x0, y0] = pt(s);
    const [x1, y1] = pt(e);
    const large = e - s > Math.PI ? 1 : 0;
    return `M${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  };
  const frac = Math.max(0, Math.min(1, (value ?? 0) / max));
  const ae = a0 + (a1 - a0) * frac;
  const h = size * 0.86;
  return (
    <View style={{ width: size, height: h, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={h}>
        <Path d={seg(a0, a1)} stroke={tokens.hairline} strokeWidth={stroke} strokeLinecap="round" fill="none" />
        {frac > 0.001 ? <Path d={seg(a0, ae)} stroke={color} strokeWidth={stroke} strokeLinecap="round" fill="none" /> : null}
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', top: size * 0.34 }}>
        <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: size * 0.24, letterSpacing: -0.8, color }}>{value != null ? value.toFixed(1) : '—'}</Text>
      </View>
    </View>
  );
}

function buildPath(data: number[], w: number, h: number, pad: number) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const x = (i: number) => pad + (i * (w - 2 * pad)) / (data.length - 1);
  const y = (v: number) => pad + (1 - (v - min) / span) * (h - 2 * pad);
  const line = data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  return { line, x, y };
}

// Линия тренда с заливкой + акцент-точка на конце.
export function TrendLine({ data, color, width = 268, height = 76 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return <View style={{ height }} />;
  const pad = 8;
  const { line, x, y } = buildPath(data, width, height, pad);
  const fill = `${line} L ${x(data.length - 1)} ${height - pad} L ${x(0)} ${height - pad} Z`;
  const gid = `wg${Math.round(x(1))}${color.replace('#', '')}`;
  const li = data.length - 1;
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.22} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      {[0, 1, 2].map((g) => (
        <Line key={g} x1={pad} y1={pad + (g * (height - 2 * pad)) / 2} x2={width - pad} y2={pad + (g * (height - 2 * pad)) / 2} stroke={tokens.hairline} strokeWidth={1} />
      ))}
      <Path d={fill} fill={`url(#${gid})`} />
      <Path d={line} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={x(li)} cy={y(data[li])} r={3.6} fill={tokens.pageBg} stroke={color} strokeWidth={2.2} />
    </Svg>
  );
}

// Мини-спарклайн (без заливки/сетки).
export function Sparkline({ data, color, width = 120, height = 26 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return <View style={{ height }} />;
  const { line } = buildPath(data, width, height, 3);
  return (
    <Svg width={width} height={height}>
      <Path d={line} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Стековый бар фаз сна (2px-зазоры).
export function StageBar({ segs }: { segs: { label: string; min: number; color: string }[] }) {
  const total = segs.reduce((s, x) => s + x.min, 0) || 1;
  const hm = (m: number) => `${Math.floor(m / 60)}ч ${String(m % 60).padStart(2, '0')}м`;
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', height: 12, gap: 2 }}>
        {segs.map((s) => (
          <View key={s.label} style={{ flex: Math.max(s.min, 0.001) / total, backgroundColor: s.color, borderRadius: 3 }} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {segs.map((s) => (
          <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: s.color }} />
            <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 11.5, color: tokens.inkMuted }}>
              {s.label} · {hm(s.min)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// Зоны пульса (5 горизонтальных баров).
const ZONE_COLORS = ['#C3BCF5', '#8FB3FF', W.strain, '#FF9F5A', '#E6483A'];
export function HrZones({ zones }: { zones: number[] }) {
  const max = Math.max(...zones, 1);
  return (
    <View style={{ gap: 7 }}>
      {zones.map((v, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ width: 52, fontFamily: 'Manrope_700Bold', fontSize: 10.5, color: tokens.inkMuted }}>Зона {i + 1}</Text>
          <View style={{ flex: 1, height: 8, borderRadius: 999, backgroundColor: tokens.hairline, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${(v / max) * 100}%`, backgroundColor: ZONE_COLORS[i], borderRadius: 999 }} />
          </View>
          <Text style={{ width: 42, textAlign: 'right', fontFamily: 'Manrope_700Bold', fontSize: 10.5, color: tokens.inkMuted }}>{v} мин</Text>
        </View>
      ))}
    </View>
  );
}

// Плитка-метрика (стекло) + опциональный спарклайн.
export function Tile({ label, value, unit, color, spark, sub }: { label: string; value: string; unit?: string; color?: string; spark?: number[]; sub?: string }) {
  return (
    <GlassCard style={{ flex: 1, padding: 13, borderRadius: 18 }}>
      <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', color: tokens.inkMuted }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 3 }}>
        <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 25, letterSpacing: -0.5, color: color ?? tokens.ink }}>{value}</Text>
        {unit ? <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: tokens.inkMuted }}>{unit}</Text> : null}
      </View>
      {sub ? <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 10, color: tokens.inkMuted, marginTop: 1 }}>{sub}</Text> : null}
      {spark && spark.length > 1 ? (
        <View style={{ marginTop: 6 }}>
          <Sparkline data={spark} color={color ?? tokens.inkMuted} width={118} height={24} />
        </View>
      ) : null}
    </GlassCard>
  );
}
