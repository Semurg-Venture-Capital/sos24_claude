import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  useMyEuroProtocols,
  type EuroProtocolRecord,
  type EuroStatus,
} from '../../../api/europrotocol';
import { BackButton } from '../../../components/ui/BackButton';
import { FAB } from '../../../components/ui/FAB';
import { Glass } from '../../../components/ui/Glass';
import { IconButton } from '../../../components/ui/IconButton';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { Segmented } from '../../../components/ui/Segmented';
import { Tag } from '../../../components/ui/Tag';
import { TextField } from '../../../components/ui/TextField';
import { tokens } from '../../../theme/colors';
import { EuroStatusBadge } from '../components/EuroStatusBadge';
import type { EuroStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<EuroStackParamList, 'EuroList'>;

const SCHEME_LABEL: Record<string, string> = { rear: 'Наезд сзади', front: 'Лобовое', side: 'Боковое' };

// 5 сегментов прогресса по статусу (M10.1).
const PROGRESS: Record<EuroStatus, number> = {
  SUBMITTED: 1,
  REVIEW: 2,
  NEED_INFO: 2,
  APPROVED: 4,
  REJECTED: 5,
  PAID: 5,
};

// Архив — завершённые дела; остальное «активные».
const ARCHIVED: EuroStatus[] = ['PAID', 'REJECTED'];

function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return d && m && y ? `${d}.${m}.${y}` : iso;
}

// M10.1 — список оформленных европротоколов пользователя.
export function EuroListScreen() {
  const nav = useNavigation<Nav>();
  const { data, isLoading, refetch } = useMyEuroProtocols();
  const [tab, setTab] = useState(0); // 0 — активные, 1 — архив
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const all = data ?? [];
  const activeCount = all.filter((p) => !ARCHIVED.includes(p.status)).length;

  const filtered = useMemo(() => {
    const byTab = all.filter((p) =>
      tab === 1 ? ARCHIVED.includes(p.status) : !ARCHIVED.includes(p.status),
    );
    const q = query.trim().toLowerCase();
    if (!q) return byTab;
    return byTab.filter((p) => {
      const hay = [
        p.number,
        p.vehicle?.brand,
        p.vehicle?.model,
        p.vehicle?.plate,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [all, tab, query]);

  const hasAny = !isLoading && all.length > 0;
  const listEmpty = !isLoading && filtered.length === 0;

  return (
    <PhoneFrame>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
          <BackButton onPress={() => nav.goBack()} />
          <Text
            style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 26, letterSpacing: -0.26, color: tokens.ink }}
          >
            Европротоколы
          </Text>
        </View>
        {hasAny && (
          <IconButton
            onPress={() => {
              setSearching((s) => {
                if (s) setQuery('');
                return !s;
              });
            }}
          >
            {searching ? <CloseIcon /> : <SearchIcon />}
          </IconButton>
        )}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.red} />
        </View>
      ) : !hasAny ? (
        <EmptyState onCreate={() => nav.navigate('EuroStart')} />
      ) : (
        <>
          <View style={{ paddingHorizontal: 24, gap: 12 }}>
            {searching && (
              <TextField
                placeholder="Номер, марка или госномер"
                value={query}
                onChangeText={setQuery}
                autoFocus
                prefix={<SearchIcon size={16} />}
              />
            )}
            <Segmented
              options={[`Активные · ${activeCount}`, 'Архив']}
              active={tab}
              onChange={setTab}
            />
          </View>

          {listEmpty ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
              <Text
                style={{
                  fontFamily: 'Manrope_400Regular',
                  fontSize: 14,
                  color: tokens.inkMuted,
                  textAlign: 'center',
                }}
              >
                {query.trim()
                  ? 'Ничего не найдено'
                  : tab === 1
                    ? 'Архив пуст'
                    : 'Нет активных европротоколов'}
              </Text>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 160, gap: 10 }}
              showsVerticalScrollIndicator={false}
            >
              {filtered.map((p) => (
                <EuroCard key={p.id} item={p} onPress={() => nav.navigate('EuroDetail', { id: p.id })} />
              ))}
            </ScrollView>
          )}

          <FAB onPress={() => nav.navigate('EuroStart')} bottom={32} />
        </>
      )}
    </PhoneFrame>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 8 }}>
      <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 20, color: tokens.ink, textAlign: 'center' }}>
        Пока нет европротоколов
      </Text>
      <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted, textAlign: 'center' }}>
        Оформите извещение о ДТП — оба участника подтверждаются через MyID
      </Text>
      <View style={{ width: 260, marginTop: 12 }}>
        <RedButton onPress={onCreate}>Оформить европротокол</RedButton>
      </View>
    </View>
  );
}

function EuroCard({ item, onPress }: { item: EuroProtocolRecord; onPress: () => void }) {
  const progress = PROGRESS[item.status];
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
          gap: 14,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ gap: 6, flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Tag tone="ink">ДТП</Tag>
              <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 11, color: tokens.inkMuted, letterSpacing: 0.4 }}>
                {item.number}
              </Text>
            </View>
            <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 15, color: tokens.ink }}>
              {item.vehicle ? `${item.vehicle.brand} ${item.vehicle.model}` : 'ДТП · европротокол'}
            </Text>
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted, letterSpacing: 0.2 }}>
              {item.vehicle?.plate ? `${item.vehicle.plate} · ` : ''}
              {formatDate(item.incidentDate)} · {item.incidentTime}
              {item.schemeType ? ` · ${SCHEME_LABEL[item.schemeType] ?? ''}` : ''}
            </Text>
          </View>
          <EuroStatusBadge status={item.status} />
        </View>

        {/* Прогресс-трекер (5 сегментов) */}
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 999,
                backgroundColor:
                  i < progress
                    ? item.status === 'REJECTED'
                      ? tokens.red
                      : tokens.inkDark
                    : 'rgba(20,20,20,0.1)',
              }}
            />
          ))}
        </View>
      </Glass>
    </Pressable>
  );
}

function SearchIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={tokens.ink} strokeWidth={1.8} strokeLinecap="round">
      <Circle cx={11} cy={11} r={7} />
      <Path d="M21 21l-4.3-4.3" />
    </Svg>
  );
}

function CloseIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={tokens.ink} strokeWidth={1.8} strokeLinecap="round">
      <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  );
}
