import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useQueryClient } from '@tanstack/react-query';
import Svg, { Circle, Path } from 'react-native-svg';
import { tokens } from '../../../theme/colors';
import { useConnectWhoop, useSyncWhoop, useWearable, timeAgo } from '../../../api/wearables';
import { MedVital } from './MedVital';
import { medGlass } from './medGlass';

// Куда WHOOP вернёт пользователя после авторизации (совпадает с WHOOP_SUCCESS_DEEPLINK на бэке).
const WHOOP_RETURN_URL = 'sos24://health/wearable';

// Цвет кольца восстановления по шкале WHOOP: зелёный ≥67, янтарный 34–66, красный <34.
function recoveryColor(score: number | null): string {
  if (score == null) return tokens.inkMuted;
  if (score >= 67) return '#16A34A';
  if (score >= 34) return '#D97706';
  return tokens.red;
}

function RecoveryRing({ score, size = 76 }: { score: number | null; size?: number }) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score ?? 0)) / 100;
  const color = recoveryColor(score);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={tokens.hairline} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
        />
      </Svg>
      <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 22, letterSpacing: -0.4, color }}>
        {score != null ? `${score}` : '—'}
      </Text>
      <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 9, color }}>%</Text>
    </View>
  );
}

// Иконка носимого трекера (пульс-линия).
function PulseIcon({ size = 22, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12h4l2-6 4 12 2.5-8 1.5 2h6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RefreshIcon({ size = 16, color = tokens.inkMuted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Секция «Мои показатели» на хабе «Здоровье». Два состояния: подключить WHOOP / метрики.
export function WhoopCard({ onOpenDetail }: { onOpenDetail?: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data, isLoading } = useWearable();
  const connect = useConnectWhoop();
  const sync = useSyncWhoop();
  const [connecting, setConnecting] = useState(false);

  // real: открываем OAuth WHOOP в браузере и ждём возврата по sos24://.
  // mock: connect уже подключил на сервере (authorizeUrl нет) — просто обновляем статус.
  const onConnect = async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      const res = await connect.mutateAsync();
      if (res?.authorizeUrl) {
        await WebBrowser.openAuthSessionAsync(res.authorizeUrl, WHOOP_RETURN_URL);
        await qc.invalidateQueries({ queryKey: ['health', 'wearable'] });
      }
    } catch {
      Alert.alert(t('healthCard.whoop.connectFailTitle'), t('healthCard.whoop.connectFailMsg'));
    } finally {
      setConnecting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[{ borderRadius: 28, padding: 24, alignItems: 'center' }, medGlass]}>
        <ActivityIndicator color={tokens.red} />
      </View>
    );
  }

  // ── Не подключено ──
  if (!data?.connected) {
    return (
      <View style={[{ borderRadius: 28, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 }, medGlass]}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 999,
            backgroundColor: tokens.inkDark,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PulseIcon size={24} color="#fff" />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 17, color: tokens.ink }}>{t('healthCard.whoop.connectTitle')}</Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12.5, color: tokens.inkMuted, lineHeight: 17 }}>
            {t('healthCard.whoop.connectSub')}
          </Text>
        </View>
        <Pressable
          onPress={onConnect}
          disabled={connecting}
          style={{
            height: 40,
            paddingHorizontal: 18,
            borderRadius: 14,
            backgroundColor: tokens.red,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: connecting ? 0.6 : 1,
          }}
        >
          {connecting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13.5, color: '#fff' }}>{t('healthCard.whoop.connect')}</Text>
          )}
        </Pressable>
      </View>
    );
  }

  // ── Подключено: метрики ──
  const m = data.metrics;
  const fmt = (n: number | null, digits = 0) => (n != null ? n.toFixed(digits) : '—');

  return (
    <Pressable onPress={onOpenDetail} style={[{ borderRadius: 28, padding: 18, gap: 16 }, medGlass]}>
      {/* Заголовок + обновлено + refresh */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ flex: 1, fontFamily: 'NeueMontreal-Medium', fontSize: 16, color: tokens.ink }}>{t('healthCard.whoop.myMetrics')}</Text>
        {data.lastSyncAt ? (
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 11.5, color: tokens.inkMuted, marginRight: 10 }}>
            {timeAgo(data.lastSyncAt)}
          </Text>
        ) : null}
        <Pressable
          onPress={() => sync.mutate()}
          disabled={sync.isPending}
          hitSlop={10}
          style={{ width: 30, height: 30, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.glass }}
        >
          {sync.isPending ? <ActivityIndicator size="small" color={tokens.inkMuted} /> : <RefreshIcon />}
        </Pressable>
      </View>

      {/* Восстановление */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <RecoveryRing score={m?.recovery.score ?? null} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: tokens.inkMuted, letterSpacing: 0.3, textTransform: 'uppercase' }}>
            {t('healthCard.whoop.recovery')}
          </Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12.5, color: tokens.inkMuted, lineHeight: 17 }}>
            {m?.recovery.score != null && m.recovery.score >= 67
              ? t('healthCard.whoop.recDesc.high')
              : m?.recovery.score != null && m.recovery.score >= 34
                ? t('healthCard.whoop.recDesc.mid')
                : t('healthCard.whoop.recDesc.low')}
          </Text>
        </View>
      </View>

      {/* Плитки */}
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <MedVital label={t('healthCard.whoop.hrv')} value={fmt(m?.recovery.hrvMs ?? null)} unit={t('healthCard.units.ms')} />
          <MedVital label={t('healthCard.whoop.restingHr')} value={fmt(m?.recovery.restingHr ?? null)} unit={t('healthCard.units.bpm')} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <MedVital label={t('healthCard.whoop.sleep')} value={fmt(m?.sleep.performance ?? null)} unit="%" />
          <MedVital label={t('healthCard.whoop.respiration')} value={fmt(m?.sleep.respiratoryRate ?? null, 1)} unit={t('healthCard.units.brpm')} />
        </View>
      </View>
    </Pressable>
  );
}
