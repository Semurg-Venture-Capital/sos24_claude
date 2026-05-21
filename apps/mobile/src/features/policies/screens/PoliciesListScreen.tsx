import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { Policy } from '../../../api/policies';
import { usePolicies } from '../../../api/policies';
import type { ProductType } from '../../../api/types';
import { IconButton } from '../../../components/ui/IconButton';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { PolicyListCard } from '../../../components/ui/PolicyListCard';
import { PolicyListCardCompact } from '../../../components/ui/PolicyListCardCompact';
import { Segmented } from '../../../components/ui/Segmented';
import { StatPill } from '../../../components/ui/StatPill';
import { tokens } from '../../../theme/colors';
import type { PoliciesStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<PoliciesStackParamList, 'PoliciesList'>;

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
  return `№ ${parts.join(' ')}`;
}

function policyVehicle(p: Policy): { car: string; plate: string } {
  if (p.vehicle) {
    return { car: `${p.vehicle.brand} ${p.vehicle.model}`, plate: p.vehicle.plate };
  }
  return { car: TYPE_LABELS[p.type] ?? p.type, plate: '—' };
}

// M8.1 — список полисов. Эталон: SOS24/screens-policies.jsx → ScreenPoliciesList.
export function PoliciesListScreen() {
  const nav = useNavigation<Nav>();
  const [tab, setTab] = useState(0);

  const { data: allPolicies, isLoading } = usePolicies();

  const active = (allPolicies ?? []).filter(
    (p) => p.status === 'ACTIVE' || p.status === 'PENDING_PAYMENT',
  );
  const expired = (allPolicies ?? []).filter(
    (p) => p.status === 'EXPIRED' || p.status === 'CANCELLED',
  );
  const expiring = active.filter((p) => computeDaysLeft(p.endDate) < 30).length;

  return (
    <PhoneFrame>
      {/* Top: title + search */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 16,
        }}
      >
        <Text
          style={{
            fontFamily: 'NeueMontreal-Medium',
            fontSize: 28,
            letterSpacing: -0.28,
            color: tokens.ink,
          }}
        >
          Мои полисы
        </Text>
        <IconButton>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={tokens.inkDark} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <Circle cx={11} cy={11} r={7} />
            <Path d="M21 21l-4.5-4.5" />
          </Svg>
        </IconButton>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.red} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 24, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <StatPill label="Активных" value={String(active.length)} tone="ink" />
            <StatPill label="Истекает" value={String(expiring)} tone="warn" />
            <StatPill label="В архиве" value={String(expired.length)} tone="glass" />
          </View>

          {/* Tabs */}
          <Segmented
            options={[`Активные · ${active.length}`, `Архив · ${expired.length}`]}
            active={tab}
            onChange={setTab}
          />

          {/* List */}
          <View style={{ gap: 10, marginTop: 4 }}>
            {tab === 0 ? (
              <>
                {active.map((p, i) => {
                  const { car, plate } = policyVehicle(p);
                  const days = computeDaysLeft(p.endDate);
                  const cardStatus = days < 30 ? 'expiring' : 'active';
                  return (
                    <PolicyListCard
                      key={p.id}
                      tone={i === 0 ? 'dark' : 'light'}
                      type={TYPE_LABELS[p.type] ?? p.type}
                      car={car}
                      plate={plate}
                      period={`${formatDate(p.startDate)} — ${formatDate(p.endDate)}`}
                      number={formatPolicyNumber(p.policyNumber)}
                      daysLeft={days}
                      status={cardStatus}
                      qrPayload={p.qrPayload ?? `sos24:${p.policyNumber ?? p.id}`}
                      onPress={() => nav.navigate('PolicyDetail', { id: p.id })}
                    />
                  );
                })}

                {active.length === 0 && (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted }}>
                      Нет активных полисов
                    </Text>
                  </View>
                )}

                {expired.length > 0 && (
                  <>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 }}>
                      <View style={{ flex: 1, height: 1, backgroundColor: tokens.hairline }} />
                      <Text
                        style={{
                          fontFamily: 'Manrope_500Medium',
                          fontSize: 11,
                          color: tokens.inkSubtle,
                          letterSpacing: 0.88,
                          textTransform: 'uppercase',
                        }}
                      >
                        Истекли
                      </Text>
                      <View style={{ flex: 1, height: 1, backgroundColor: tokens.hairline }} />
                    </View>
                    {expired.map((p) => {
                      const { car, plate } = policyVehicle(p);
                      return (
                        <PolicyListCardCompact
                          key={p.id}
                          type={TYPE_LABELS[p.type] ?? p.type}
                          car={car}
                          plate={plate}
                          expiredAt={formatDate(p.endDate)}
                          onPress={() => nav.navigate('PolicyDetail', { id: p.id })}
                        />
                      );
                    })}
                  </>
                )}
              </>
            ) : (
              <>
                {expired.map((p) => {
                  const { car, plate } = policyVehicle(p);
                  return (
                    <PolicyListCardCompact
                      key={p.id}
                      type={TYPE_LABELS[p.type] ?? p.type}
                      car={car}
                      plate={plate}
                      expiredAt={formatDate(p.endDate)}
                      onPress={() => nav.navigate('PolicyDetail', { id: p.id })}
                    />
                  );
                })}
                {expired.length === 0 && (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted }}>
                      Архив пуст
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      )}
    </PhoneFrame>
  );
}
