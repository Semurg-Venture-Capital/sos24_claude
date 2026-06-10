import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import {
  EURO_STATUS_LABEL,
  useMyEuroProtocols,
  type EuroProtocolRecord,
} from '../../../api/europrotocol';
import { BackButton } from '../../../components/ui/BackButton';
import { Glass } from '../../../components/ui/Glass';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { tokens } from '../../../theme/colors';
import { EuroStatusBadge } from '../components/EuroStatusBadge';
import type { EuroStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<EuroStackParamList, 'EuroList'>;

const SCHEME_LABEL: Record<string, string> = { rear: 'Наезд сзади', front: 'Лобовое', side: 'Боковое' };

function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return d && m && y ? `${d}.${m}.${y}` : iso;
}

// M10.1 — список оформленных европротоколов пользователя.
export function EuroListScreen() {
  const nav = useNavigation<Nav>();
  const { data, isLoading, refetch } = useMyEuroProtocols();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const isEmpty = !isLoading && (data?.length ?? 0) === 0;

  return (
    <PhoneFrame>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 }}>
        <BackButton onPress={() => nav.goBack()} />
        <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 26, letterSpacing: -0.26, color: tokens.ink }}>
          Мои европротоколы
        </Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.red} />
        </View>
      ) : isEmpty ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 8 }}>
          <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 20, color: tokens.ink, textAlign: 'center' }}>
            Пока нет европротоколов
          </Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted, textAlign: 'center' }}>
            Оформленные извещения о ДТП появятся здесь
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {data?.map((p) => (
            <EuroCard key={p.id} item={p} onPress={() => nav.navigate('EuroDetail', { id: p.id })} />
          ))}
        </ScrollView>
      )}
    </PhoneFrame>
  );
}

function EuroCard({ item, onPress }: { item: EuroProtocolRecord; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ borderRadius: 24, overflow: 'hidden', opacity: pressed ? 0.7 : 1 })}>
      <Glass
        intensity={20}
        tint="light"
        style={{
          backgroundColor: 'rgba(255,255,255,0.55)',
          padding: 18,
          borderWidth: 1,
          borderColor: tokens.hairline,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ gap: 4, flex: 1 }}>
            <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12, color: tokens.inkMuted, letterSpacing: 0.4 }}>
              {item.number}
            </Text>
            <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 16, color: tokens.ink }}>
              {item.vehicle ? `${item.vehicle.brand} ${item.vehicle.model}` : 'ДТП · европротокол'}
            </Text>
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>
              {item.vehicle?.plate ? `${item.vehicle.plate} · ` : ''}
              {formatDate(item.incidentDate)} · {item.incidentTime}
              {item.schemeType ? ` · ${SCHEME_LABEL[item.schemeType] ?? ''}` : ''}
            </Text>
          </View>
          <EuroStatusBadge status={item.status} />
        </View>
      </Glass>
    </Pressable>
  );
}
