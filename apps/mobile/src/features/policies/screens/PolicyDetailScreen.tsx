import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useMe } from '../../../api/auth';
import { usePolicy } from '../../../api/policies';
import type { ProductType } from '../../../api/types';
import { BackButton } from '../../../components/ui/BackButton';
import { IconButton } from '../../../components/ui/IconButton';
import { OutlineButton } from '../../../components/ui/OutlineButton';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { PolicyQR } from '../../../components/ui/PolicyQR';
import { RedButton } from '../../../components/ui/RedButton';
import { SosLogo } from '../../../components/ui/SosLogo';
import { SummaryBlock } from '../../../components/ui/SummaryBlock';
import { Tag } from '../../../components/ui/Tag';
import { tokens } from '../../../theme/colors';
import type { PoliciesStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<PoliciesStackParamList, 'PolicyDetail'>;
type R = RouteProp<PoliciesStackParamList, 'PolicyDetail'>;

const TYPE_LABELS: Record<ProductType, string> = {
  OSAGO: 'ОСАГО',
  KASKO: 'КАСКО',
  HEALTH: 'Здоровье',
  HOME: 'Дом',
  FINANCE: 'Финансы',
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function computeDaysLeft(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  return Math.max(0, Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatPolicyNumber(n: string | null): string {
  if (!n) return '—';
  const clean = n.replace(/\s/g, '');
  const parts = clean.match(/.{1,4}/g) ?? [];
  return parts.join(' ');
}

function formatMoney(amount: number): string {
  return amount.toLocaleString('ru-RU') + ' сум';
}

// M8.2 — детальная карточка полиса. Эталон: ScreenPolicyDetail.
export function PolicyDetailScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<R>();

  const { data: policy, isLoading } = usePolicy(route.params.id);
  const { data: me } = useMe();

  if (isLoading) {
    return (
      <PhoneFrame>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.red} />
        </View>
      </PhoneFrame>
    );
  }

  if (!policy) {
    return (
      <PhoneFrame>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: tokens.inkMuted, fontFamily: 'Manrope_400Regular' }}>Полис не найден</Text>
        </View>
      </PhoneFrame>
    );
  }

  const typeLabel = TYPE_LABELS[policy.type] ?? policy.type;
  const plate = policy.vehicle?.plate ?? '—';
  const car = policy.vehicle ? `${policy.vehicle.brand} ${policy.vehicle.model}` : typeLabel;
  const carYear = policy.vehicle?.year;
  const daysLeft = computeDaysLeft(policy.endDate);
  const isExpired = policy.status === 'EXPIRED' || policy.status === 'CANCELLED';
  const isExpiring = !isExpired && daysLeft < 30;
  const qrValue = policy.qrPayload ?? `sos24:${policy.policyNumber ?? policy.id}`;
  const holderName =
    me && (me.name || me.surname)
      ? `${me.surname ?? ''} ${me.name?.[0] ?? ''}.`.trim()
      : '—';

  const tagTone = isExpiring ? 'yellow' : isExpired ? 'glass' : 'green';
  const tagLabel = isExpiring ? `${daysLeft} дн.` : isExpired ? 'Истёк' : 'Активен';

  return (
    <PhoneFrame>
      {/* Top: back + share/menu */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 8,
        }}
      >
        <BackButton onPress={() => nav.goBack()} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <IconButton>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={tokens.inkDark} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7" />
              <Path d="M16 6l-4-4-4 4M12 2v14" />
            </Svg>
          </IconButton>
          <IconButton>
            <Svg width={4} height={16} viewBox="0 0 4 16" fill={tokens.inkDark}>
              <Circle cx={2} cy={2} r={2} />
              <Circle cx={2} cy={8} r={2} />
              <Circle cx={2} cy={14} r={2} />
            </Svg>
          </IconButton>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 200, gap: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Big dark policy card with QR */}
        <View
          style={{
            borderRadius: 36,
            backgroundColor: tokens.inkDark,
            padding: 22,
            paddingBottom: 24,
            gap: 18,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 24 },
            shadowOpacity: 0.35,
            shadowRadius: 24,
            elevation: 8,
          }}
        >
          {/* Red halo decoration */}
          <View
            style={{
              position: 'absolute',
              right: -60,
              top: -60,
              width: 200,
              height: 200,
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <LinearGradient
              colors={['rgba(230,20,40,0.18)', 'rgba(230,20,40,0)']}
              start={{ x: 0.5, y: 0.5 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1 }}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <SosLogo size="md" color="#fff" />
            <Tag tone={tagTone}>{tagLabel}</Tag>
          </View>

          {/* QR centered */}
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <PolicyQR value={qrValue} size={180} padding={10} />
          </View>

          {/* Bottom row: type+plate (left), expand button (right) */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
            <View style={{ gap: 4, flex: 1 }}>
              <Text
                style={{
                  fontFamily: 'Manrope_400Regular',
                  fontSize: 11,
                  color: tokens.inkMutedDark,
                  letterSpacing: 0.88,
                  textTransform: 'uppercase',
                }}
              >
                {typeLabel} · {policy.periodMonths} мес
              </Text>
              <Text
                style={{
                  fontFamily: 'NeueMontreal-Medium',
                  fontSize: 26,
                  letterSpacing: -0.13,
                  color: '#fff',
                  lineHeight: 28,
                }}
              >
                {plate}
              </Text>
              {car && (
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMutedDark, marginTop: 4 }}>
                  {car}{carYear ? ` · ${carYear}` : ''}
                </Text>
              )}
            </View>
            <Pressable
              onPress={() => nav.navigate('PolicyQrFullscreen', { id: policy.id })}
              style={({ pressed }) => ({
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.12)',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </Svg>
              <Text style={{ color: '#fff', fontFamily: 'Manrope_500Medium', fontSize: 12 }}>
                Развернуть
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Summary blocks */}
        <SummaryBlock
          eyebrow="Полис"
          rows={[
            { label: 'Номер', value: formatPolicyNumber(policy.policyNumber) },
            { label: 'Страхователь', value: holderName },
            { label: 'Период', value: `${formatDate(policy.startDate)} — ${formatDate(policy.endDate)}` },
            { label: 'Страховая премия', value: formatMoney(policy.totalPrice) },
            ...(policy.discount > 0 ? [{ label: 'Скидка', value: `−${formatMoney(policy.discount)}` }] : []),
          ]}
        />
      </ScrollView>

      {/* Sticky actions */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: 24,
          paddingTop: 16,
          gap: 8,
        }}
      >
        <RedButton trailing={false} onPress={() => {}}>
          ! Сообщить о ДТП
        </RedButton>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <OutlineButton style={{ flex: 1, height: 52 }}>↓ PDF</OutlineButton>
          <OutlineButton style={{ flex: 1, height: 52 }}>Продлить</OutlineButton>
        </View>
      </View>
    </PhoneFrame>
  );
}
