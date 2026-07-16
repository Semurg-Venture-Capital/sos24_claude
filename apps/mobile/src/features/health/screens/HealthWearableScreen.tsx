import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../../../theme/colors';
import type { HealthStackParamList } from '../../../navigation/types';
import { BackButton } from '../../../components/ui/BackButton';
import { Glass } from '../../../components/ui/Glass';
import { LiquidGlassChips } from '../components';
import { useDisconnectWhoop, useSyncWhoop, useWearable, timeAgo } from '../../../api/wearables';
import { WhoopOverviewTab, WhoopRecoveryTab, WhoopSleepTab, WhoopStrainTab, WhoopTrendsTab } from '../whoop/WhoopTabs';

type Nav = NativeStackNavigationProp<HealthStackParamList, 'HealthWearable'>;

// Экран показателей WHOOP: липкий стеклянный хедер + Liquid Glass табы + контент.
export function HealthWearableScreen() {
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const TABS = [
    { key: 'overview', label: t('healthCard.whoop.tabs.overview') },
    { key: 'recovery', label: t('healthCard.whoop.tabs.recovery') },
    { key: 'sleep', label: t('healthCard.whoop.tabs.sleep') },
    { key: 'strain', label: t('healthCard.whoop.tabs.strain') },
    { key: 'trends', label: t('healthCard.whoop.tabs.trends') },
  ];
  const { data, isLoading } = useWearable();
  const sync = useSyncWhoop();
  const disconnect = useDisconnectWhoop();
  const [tab, setTab] = useState('overview');
  const [range, setRange] = useState<14 | 30 | 90>(14);
  const [headerH, setHeaderH] = useState(insets.top + 108);
  const m = data?.metrics ?? null;

  const onDisconnect = () => {
    Alert.alert(t('healthCard.whoop.disconnectTitle'), t('healthCard.whoop.disconnectMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('healthCard.whoop.disconnect'), style: 'destructive', onPress: () => disconnect.mutate(undefined, { onSuccess: () => nav.goBack() }) },
    ]);
  };

  const header = (withTabs: boolean) => (
    <View onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)} style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
      <Glass intensity={26} tint="light">
        <View style={{ paddingTop: insets.top + 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 8 }}>
            <BackButton onPress={() => nav.goBack()} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 19, letterSpacing: -0.3, color: tokens.ink }}>{t('healthCard.whoop.screenTitle')}</Text>
              {data?.lastSyncAt ? (
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 11, color: tokens.inkMuted }}>
                  {t('healthCard.whoop.updated', { ago: timeAgo(data.lastSyncAt) })}{data.mode === 'mock' ? t('healthCard.whoop.demoSuffix') : ''}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => sync.mutate()}
              disabled={sync.isPending}
              hitSlop={8}
              style={{ paddingHorizontal: 14, height: 32, borderRadius: 999, backgroundColor: tokens.glass, borderWidth: 1, borderColor: tokens.hairline, alignItems: 'center', justifyContent: 'center' }}
            >
              {sync.isPending ? <ActivityIndicator size="small" color={tokens.inkMuted} /> : <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 12.5, color: tokens.inkDark }}>{t('healthCard.whoop.refresh')}</Text>}
            </Pressable>
          </View>
          {withTabs ? (
            <View style={{ paddingBottom: 6 }}>
              <LiquidGlassChips items={TABS} selectedKey={tab} onSelect={setTab} />
            </View>
          ) : null}
        </View>
      </Glass>
    </View>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.pageBg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={tokens.red} />
      </View>
    );
  }

  if (!data?.connected || !m) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.pageBg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, paddingTop: insets.top + 80 }}>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted, textAlign: 'center', lineHeight: 20 }}>
            {t('healthCard.whoop.notConnected')}
          </Text>
        </View>
        {header(false)}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tokens.pageBg }}>
      <View style={{ flex: 1, paddingTop: headerH }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 60, gap: 14 }}>
          {tab === 'overview' ? <WhoopOverviewTab m={m} /> : null}
          {tab === 'recovery' ? <WhoopRecoveryTab m={m} /> : null}
          {tab === 'sleep' ? <WhoopSleepTab m={m} /> : null}
          {tab === 'strain' ? <WhoopStrainTab m={m} /> : null}
          {tab === 'trends' ? <WhoopTrendsTab range={range} onRange={setRange} /> : null}

          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 11, color: tokens.inkMuted, textAlign: 'center', lineHeight: 16, marginTop: 6 }}>
            {t('healthCard.whoop.disclaimer')}
          </Text>
          <Pressable onPress={onDisconnect} style={{ alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 20 }}>
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.red }}>{t('healthCard.whoop.disconnectBtn')}</Text>
          </Pressable>
        </ScrollView>
      </View>
      {header(true)}
    </View>
  );
}
