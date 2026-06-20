import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useRemoveNotification,
  type AppNotification,
  type NotificationType,
} from '../../../api/notifications';
import { BackButton } from '../../../components/ui/BackButton';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { tokens } from '../../../theme/colors';
import type { MainStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Notifications'>;

type Tone = 'ink' | 'green' | 'red' | 'blue' | 'yellow';

const TONE: Record<Tone, { bg: string; fg: string }> = {
  ink: { bg: tokens.inkDark, fg: '#fff' },
  green: { bg: 'rgba(105,228,183,0.85)', fg: '#0a3a26' },
  red: { bg: 'rgba(230,20,40,0.15)', fg: tokens.red },
  blue: { bg: 'rgba(86,140,255,0.18)', fg: '#1a3577' },
  yellow: { bg: 'rgba(245,200,80,0.5)', fg: '#503a07' },
};

const TYPE_TONE: Record<NotificationType, Tone> = {
  POLICY_ACTIVATED: 'green',
  POLICY_EXPIRING: 'red',
  SUPPORT_REPLY: 'blue',
  CLAIM_STATUS: 'ink',
  EUROPROTOCOL_STATUS: 'ink',
  PROMO: 'yellow',
  SYSTEM: 'ink',
};

export function NotificationsScreen() {
  const nav = useNavigation<Nav>();
  const { data: items, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const removeNotif = useRemoveNotification();

  const groups = groupByDay(items ?? []);
  const hasUnread = (items ?? []).some((n) => !n.readAt);

  const onPress = (n: AppNotification) => {
    if (!n.readAt) markRead.mutate(n.id);
    // deep link можно расширить позже (n.data.screen / id)
  };
  const onLongPress = (n: AppNotification) => {
    Alert.alert('Уведомление', n.title, [
      { text: 'Удалить', style: 'destructive', onPress: () => removeNotif.mutate(n.id) },
      { text: 'Отмена', style: 'cancel' },
    ]);
  };

  return (
    <PhoneFrame>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 }}>
        <BackButton onPress={() => nav.goBack()} />
        <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 20, color: tokens.ink }}>Уведомления</Text>
        <Pressable onPress={() => hasUnread && markAllRead.mutate()} hitSlop={8}>
          <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: hasUnread ? tokens.inkSubtle : 'rgba(20,20,20,0.25)' }}>
            Прочитать все
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.red} />
        </View>
      ) : !items?.length ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40 }}>
          <BellBig />
          <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 15, color: tokens.inkMuted }}>Уведомлений пока нет</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, gap: 22 }} showsVerticalScrollIndicator={false}>
          {groups.map((g) => (
            <View key={g.label} style={{ gap: 10 }}>
              <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: tokens.inkMuted, letterSpacing: 0.88, textTransform: 'uppercase', paddingLeft: 4 }}>
                {g.label}
              </Text>
              <View style={{ borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: tokens.hairline }}>
                {g.items.map((n, i) => (
                  <NotifRow key={n.id} n={n} last={i === g.items.length - 1} onPress={() => onPress(n)} onLongPress={() => onLongPress(n)} />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </PhoneFrame>
  );
}

function NotifRow({ n, last, onPress, onLongPress }: { n: AppNotification; last: boolean; onPress: () => void; onLongPress: () => void }) {
  const unread = !n.readAt;
  const tone = TONE[TYPE_TONE[n.type] ?? 'ink'];
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        padding: 14,
        paddingHorizontal: 16,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: tokens.hairline,
        backgroundColor: unread ? 'rgba(255,255,255,0.92)' : 'transparent',
      }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: tone.bg, alignItems: 'center', justifyContent: 'center' }}>
        <NotifGlyph type={n.type} color={tone.fg} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text numberOfLines={1} style={{ fontFamily: unread ? 'Manrope_600SemiBold' : 'Manrope_500Medium', fontSize: 14, color: unread ? tokens.ink : tokens.inkSubtle }}>
          {n.title}
        </Text>
        <Text numberOfLines={2} style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, lineHeight: 16, color: tokens.inkMuted }}>
          {n.body}
        </Text>
      </View>
      <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 11, color: tokens.inkSubtle }}>{formatTime(n.createdAt)}</Text>
    </Pressable>
  );
}

// ── Иконки по типу ──
function NotifGlyph({ type, color }: { type: NotificationType; color: string }) {
  const p = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (type) {
    case 'POLICY_ACTIVATED':
      return <Svg {...p}><Path d="M5 12l5 5 9-11" /></Svg>;
    case 'POLICY_EXPIRING':
      return <Svg {...p}><Path d="M12 8v5M12 16.5v.5" /><Path d="M10.3 3.9 2.4 18a1.8 1.8 0 0 0 1.6 2.7h16a1.8 1.8 0 0 0 1.6-2.7L13.7 3.9a1.8 1.8 0 0 0-3.1 0z" /></Svg>;
    case 'SUPPORT_REPLY':
      return <Svg {...p}><Path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" /></Svg>;
    case 'PROMO':
      return <Svg {...p}><Path d="M9 5H5a2 2 0 0 0-2 2v4l9 9 6-6-9-9z" /><Circle cx={7.5} cy={9.5} r={1.2} fill={color} /></Svg>;
    case 'CLAIM_STATUS':
    case 'EUROPROTOCOL_STATUS':
    case 'SYSTEM':
    default:
      return <Svg {...p}><Path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><Path d="M14 3v5h5" /></Svg>;
  }
}

function BellBig() {
  return (
    <Svg width={56} height={56} viewBox="0 0 24 24" fill="none" stroke="rgba(20,20,20,0.25)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </Svg>
  );
}

// ── Группировка по дням ──
function groupByDay(items: AppNotification[]): { label: string; items: AppNotification[] }[] {
  const today: AppNotification[] = [];
  const yesterday: AppNotification[] = [];
  const earlier: AppNotification[] = [];
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startYesterday = startToday - 86400000;
  for (const n of items) {
    const t = new Date(n.createdAt).getTime();
    if (t >= startToday) today.push(n);
    else if (t >= startYesterday) yesterday.push(n);
    else earlier.push(n);
  }
  return [
    { label: 'Сегодня', items: today },
    { label: 'Вчера', items: yesterday },
    { label: 'Раньше', items: earlier },
  ].filter((g) => g.items.length > 0);
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}
