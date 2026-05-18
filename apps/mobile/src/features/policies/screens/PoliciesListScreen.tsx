import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { IconButton } from '../../../components/ui/IconButton';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { PolicyListCard } from '../../../components/ui/PolicyListCard';
import { PolicyListCardCompact } from '../../../components/ui/PolicyListCardCompact';
import { Segmented } from '../../../components/ui/Segmented';
import { StatPill } from '../../../components/ui/StatPill';
import { tokens } from '../../../theme/colors';
import { MOCK_EXPIRED, MOCK_POLICIES } from '../mockPolicies';
import type { PoliciesStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<PoliciesStackParamList, 'PoliciesList'>;

// M8.1 — список полисов. Эталон: SOS24/screens-policies.jsx → ScreenPoliciesList.
export function PoliciesListScreen() {
  const nav = useNavigation<Nav>();
  const [tab, setTab] = useState(0);

  const active = MOCK_POLICIES;
  const expiring = active.filter((p) => p.status === 'expiring').length;
  const expired = MOCK_EXPIRED;

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
              {active.map((p, i) => (
                <PolicyListCard
                  key={p.id}
                  tone={i === 0 ? 'dark' : 'light'}
                  type={p.type}
                  car={p.car}
                  plate={p.plate}
                  period={p.period}
                  number={p.formattedNumber}
                  daysLeft={p.daysLeft}
                  status={p.status === 'expiring' ? 'expiring' : 'active'}
                  qrPayload={`sos24:${p.number}`}
                  onPress={() => nav.navigate('PolicyDetail', { id: p.id })}
                />
              ))}
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
                  {expired.map((p) => (
                    <PolicyListCardCompact
                      key={p.id}
                      type={p.type}
                      car={p.car}
                      plate={p.plate}
                      expiredAt={p.validTo.split('-').reverse().join('.')}
                      onPress={() => nav.navigate('PolicyDetail', { id: p.id })}
                    />
                  ))}
                </>
              )}
            </>
          ) : (
            <>
              {expired.map((p) => (
                <PolicyListCardCompact
                  key={p.id}
                  type={p.type}
                  car={p.car}
                  plate={p.plate}
                  expiredAt={p.validTo.split('-').reverse().join('.')}
                  onPress={() => nav.navigate('PolicyDetail', { id: p.id })}
                />
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </PhoneFrame>
  );
}
