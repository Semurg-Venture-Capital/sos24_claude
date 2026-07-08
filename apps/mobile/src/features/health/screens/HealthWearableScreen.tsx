import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../../theme/colors';
import type { HealthStackParamList } from '../../../navigation/types';
import { MedVital, medGlass } from '../components';
import { useDisconnectWhoop, useSyncWhoop, useWearable, timeAgo } from '../../../api/wearables';

type Nav = NativeStackNavigationProp<HealthStackParamList, 'HealthWearable'>;

function recoveryColor(score: number | null): string {
  if (score == null) return tokens.inkMuted;
  if (score >= 67) return '#16A34A';
  if (score >= 34) return '#D97706';
  return tokens.red;
}

function BackIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={tokens.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Ring({ score, size = 128 }: { score: number | null; size?: number }) {
  const stroke = 11;
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
      <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 38, letterSpacing: -0.8, color }}>{score ?? '—'}</Text>
      <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: tokens.inkMuted, marginTop: -2 }}>Восстановление</Text>
    </View>
  );
}

const STAGE_COLORS = { deep: '#4338CA', rem: '#A78BFA', light: '#93C5FD', awake: '#D1D5DB' };

function SleepStages({ light, deep, rem, awake }: { light: number | null; deep: number | null; rem: number | null; awake: number | null }) {
  const segs = [
    { key: 'deep', label: 'Глубокий', min: deep ?? 0, color: STAGE_COLORS.deep },
    { key: 'rem', label: 'REM', min: rem ?? 0, color: STAGE_COLORS.rem },
    { key: 'light', label: 'Лёгкий', min: light ?? 0, color: STAGE_COLORS.light },
    { key: 'awake', label: 'Бодрств.', min: awake ?? 0, color: STAGE_COLORS.awake },
  ];
  const total = segs.reduce((s, x) => s + x.min, 0) || 1;
  const hm = (m: number) => `${Math.floor(m / 60)}ч ${m % 60}м`;
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden' }}>
        {segs.map((s) => (
          <View key={s.key} style={{ flex: Math.max(s.min, 0.001) / total, backgroundColor: s.color }} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {segs.map((s) => (
          <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: s.color }} />
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>
              {s.label} · {hm(s.min)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={[{ borderRadius: 24, padding: 18, gap: 14 }, medGlass]}>
      <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 16, color: tokens.ink }}>{title}</Text>
      {children}
    </View>
  );
}

// Детальный экран показателей носимого трекера (WHOOP).
export function HealthWearableScreen() {
  const nav = useNavigation<Nav>();
  const { data, isLoading } = useWearable();
  const sync = useSyncWhoop();
  const disconnect = useDisconnectWhoop();
  const m = data?.metrics;
  const fmt = (n: number | null | undefined, d = 0) => (n != null ? n.toFixed(d) : '—');

  const onDisconnect = () => {
    Alert.alert('Отключить WHOOP?', 'Показатели перестанут обновляться. Данные в мед.карте останутся.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Отключить',
        style: 'destructive',
        onPress: () => disconnect.mutate(undefined, { onSuccess: () => nav.goBack() }),
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.pageBg }} edges={['top']}>
      {/* Хедер */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
        <Pressable onPress={() => nav.goBack()} hitSlop={8} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <BackIcon />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: 'NeueMontreal-Medium', fontSize: 20, color: tokens.ink }}>Мои показатели</Text>
        <Pressable
          onPress={() => sync.mutate()}
          disabled={sync.isPending}
          style={{ paddingHorizontal: 14, height: 34, borderRadius: 12, backgroundColor: tokens.glass, alignItems: 'center', justifyContent: 'center' }}
        >
          {sync.isPending ? (
            <ActivityIndicator size="small" color={tokens.inkMuted} />
          ) : (
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 12.5, color: tokens.ink }}>Обновить</Text>
          )}
        </Pressable>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.red} />
        </View>
      ) : !data?.connected ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted, textAlign: 'center' }}>
            WHOOP не подключён. Вернитесь на экран «Здоровье» и нажмите «Подключить».
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 60 }}>
          {data.lastSyncAt ? (
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted, textAlign: 'center' }}>
              Обновлено {timeAgo(data.lastSyncAt)} · WHOOP {data.mode === 'mock' ? '(демо-данные)' : ''}
            </Text>
          ) : null}

          {/* Восстановление */}
          <Block title="Готовность">
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Ring score={m?.recovery.score ?? null} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <MedVital label="ВСР" value={fmt(m?.recovery.hrvMs)} unit="мс" />
              <MedVital label="Пульс покоя" value={fmt(m?.recovery.restingHr)} unit="уд/м" />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <MedVital label="Кислород" value={fmt(m?.recovery.spo2, 1)} unit="%" />
              <MedVital label="Темп. кожи" value={fmt(m?.recovery.skinTempC, 1)} unit="°C" />
            </View>
          </Block>

          {/* Сон */}
          <Block title={`Сон${m?.sleep.performance != null ? ` · ${m.sleep.performance}%` : ''}`}>
            <SleepStages
              light={m?.sleep.stages.lightMin ?? null}
              deep={m?.sleep.stages.deepMin ?? null}
              rem={m?.sleep.stages.remMin ?? null}
              awake={m?.sleep.stages.awakeMin ?? null}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <MedVital
                label="Всего сна"
                value={m?.sleep.totalMinutes != null ? `${Math.floor(m.sleep.totalMinutes / 60)}ч ${m.sleep.totalMinutes % 60}м` : '—'}
              />
              <MedVital label="Дыхание" value={fmt(m?.sleep.respiratoryRate, 1)} unit="вд/м" />
            </View>
          </Block>

          {/* Нагрузка */}
          <Block title="Дневная нагрузка">
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <MedVital label="Strain" value={fmt(m?.cycle.strain, 1)} accent />
              <MedVital label="Ср. пульс" value={fmt(m?.cycle.avgHr)} unit="уд/м" />
              <MedVital label="Макс. пульс" value={fmt(m?.cycle.maxHr)} unit="уд/м" />
            </View>
          </Block>

          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 11.5, color: tokens.inkMuted, textAlign: 'center', lineHeight: 16 }}>
            Данные носимого устройства информативны и не являются медицинским диагнозом.
          </Text>

          <Pressable onPress={onDisconnect} style={{ alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 20 }}>
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13.5, color: tokens.red }}>Отключить WHOOP</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
