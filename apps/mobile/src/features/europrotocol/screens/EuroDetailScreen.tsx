import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';
import Svg, { Path } from 'react-native-svg';
import {
  EURO_STATUS_LABEL,
  participantFullName,
  useEuroProtocol,
  type EuroStatus,
} from '../../../api/europrotocol';
import { apiBaseUrl } from '../../../api/client';
import { useAuthStore } from '../../../stores/authStore';
import { BackButton } from '../../../components/ui/BackButton';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { SummaryBlock } from '../../../components/ui/SummaryBlock';
import { tokens } from '../../../theme/colors';
import { EuroStatusBadge } from '../components/EuroStatusBadge';
import type { EuroStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<EuroStackParamList, 'EuroDetail'>;
type R = RouteProp<EuroStackParamList, 'EuroDetail'>;

const SCHEME_LABEL: Record<string, string> = { rear: 'Наезд сзади', front: 'Лобовое', side: 'Боковое' };
const STEPS = ['Подано', 'Принято в работу', 'На рассмотрении', 'Решение', 'Выплата'];
// Индекс последнего ЗАВЕРШЁННОГО шага по статусу.
const DONE_UP_TO: Record<EuroStatus, number> = {
  SUBMITTED: 0,
  REVIEW: 1,
  NEED_INFO: 1,
  APPROVED: 3,
  REJECTED: 2,
  PAID: 4,
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return d && m && y ? `${d}.${m}.${y}` : iso;
}

export function EuroDetailScreen() {
  const nav = useNavigation<Nav>();
  const { id } = useRoute<R>().params;
  const { data: p, isLoading } = useEuroProtocol(id);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null); // открыт превью-просмотр PDF

  // Скачивает PDF (с Bearer-токеном) и открывает превью (quick view); поделиться — из превью.
  const openPdf = async () => {
    setPdfBusy(true);
    try {
      const token = useAuthStore.getState().accessToken;
      const target = `${FileSystem.cacheDirectory}europrotocol-${p?.number ?? id}.pdf`;
      const dl = await FileSystem.downloadAsync(`${apiBaseUrl()}/europrotocol/${id}/pdf`, target, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (dl.status !== 200) throw new Error(String(dl.status));
      setPdfUri(dl.uri);
    } catch {
      Alert.alert('PDF', 'Не удалось получить PDF. Попробуйте позже.');
    } finally {
      setPdfBusy(false);
    }
  };

  const sharePdf = async () => {
    if (pdfUri && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(pdfUri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    }
  };

  if (isLoading || !p) {
    return (
      <PhoneFrame>
        <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
          <BackButton onPress={() => nav.goBack()} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {isLoading ? <ActivityIndicator color={tokens.red} /> : <Text style={{ color: tokens.inkMuted }}>Не найдено</Text>}
        </View>
      </PhoneFrame>
    );
  }

  const doneUpTo = DONE_UP_TO[p.status];
  const rejected = p.status === 'REJECTED';

  return (
    <PhoneFrame>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 }}>
        <BackButton onPress={() => nav.goBack()} />
        <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.inkMuted }}>{p.number}</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Статус-герой */}
        <View style={{ padding: 22, borderRadius: 28, backgroundColor: tokens.inkDark, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 11, letterSpacing: 0.88, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
              ДТП · Европротокол
            </Text>
            <EuroStatusBadge status={p.status} />
          </View>
          <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 22, color: '#fff', lineHeight: 27 }}>
            {EURO_STATUS_LABEL[p.status]}
          </Text>
          {p.adminNote ? (
            <View style={{ padding: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMutedDark, lineHeight: 18 }}>
                {p.adminNote}
              </Text>
            </View>
          ) : null}
        </View>

        {/* PDF извещения */}
        <Pressable
          onPress={openPdf}
          disabled={pdfBusy}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 15,
            borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,0.6)',
            borderWidth: 1,
            borderColor: tokens.hairline,
            opacity: pressed || pdfBusy ? 0.7 : 1,
          })}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={tokens.red} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
          </Svg>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: tokens.inkDark }}>
            {pdfBusy ? 'Готовим PDF…' : 'PDF извещения'}
          </Text>
        </Pressable>

        {/* Трекер */}
        <View style={{ padding: 20, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.55)', borderWidth: 1, borderColor: tokens.hairline }}>
          {STEPS.map((label, i) => {
            const state =
              rejected && i === 3 ? 'rejected' : i <= doneUpTo ? 'done' : i === doneUpTo + 1 && !rejected ? 'active' : 'pending';
            return <TrackerStep key={label} label={label} state={state} last={i === STEPS.length - 1} />;
          })}
        </View>

        {/* Детали */}
        <SummaryBlock
          eyebrow="Обстоятельства"
          rows={[
            { label: 'Дата и время', value: `${formatDate(p.incidentDate)} · ${p.incidentTime}` },
            { label: 'Место', value: p.place || '—' },
            { label: 'Схема', value: p.schemeType ? SCHEME_LABEL[p.schemeType] ?? p.schemeType : '—' },
          ]}
        />
        <SummaryBlock
          eyebrow="Сторона A · Вы"
          rows={[
            { label: 'Авто', value: p.vehicle ? `${p.vehicle.brand} ${p.vehicle.model}` : '—' },
            { label: 'Госномер', value: p.vehicle?.plate ?? '—' },
            { label: 'MyID', value: p.selfVerified ? 'Подтверждён' : '—' },
          ]}
        />
        <SummaryBlock
          eyebrow="Сторона B · Второй участник"
          rows={[
            { label: 'Участник', value: p.participant ? participantFullName(p.participant) : '—' },
            { label: 'Госномер', value: p.otherGov ?? '—' },
            {
              label: 'Полис',
              value:
                p.otherPolicySeria || p.otherPolicyNumber
                  ? `${p.otherPolicySeria ?? ''} ${p.otherPolicyNumber ?? ''}`.trim() + (p.otherPolicyValid ? ' ✓' : '')
                  : '—',
            },
            { label: 'Подпись', value: p.participant ? 'MyID ✓' : '—' },
          ]}
        />
        {p.description ? <SummaryBlock eyebrow="Описание" rows={[{ label: '', value: p.description }]} /> : null}
      </ScrollView>

      {/* Превью PDF (quick view) + кнопка «Поделиться» */}
      <Modal visible={!!pdfUri} animationType="slide" onRequestClose={() => setPdfUri(null)}>
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 56,
              paddingHorizontal: 16,
              paddingBottom: 10,
              borderBottomWidth: 1,
              borderBottomColor: tokens.hairline,
            }}
          >
            <Pressable onPress={() => setPdfUri(null)} hitSlop={8}>
              <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 16, color: tokens.inkDark }}>Закрыть</Text>
            </Pressable>
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 15, color: tokens.ink }}>PDF извещения</Text>
            <Pressable onPress={sharePdf} hitSlop={8}>
              <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 16, color: tokens.red }}>Поделиться</Text>
            </Pressable>
          </View>
          {pdfUri ? <WebView source={{ uri: pdfUri }} style={{ flex: 1 }} originWhitelist={['*']} /> : null}
        </View>
      </Modal>
    </PhoneFrame>
  );
}

function TrackerStep({ label, state, last }: { label: string; state: 'done' | 'active' | 'pending' | 'rejected'; last: boolean }) {
  const dotColor =
    state === 'done' ? tokens.inkDark : state === 'active' ? tokens.red : state === 'rejected' ? tokens.red : 'rgba(20,20,20,0.18)';
  const titleColor = state === 'pending' ? tokens.inkMuted : tokens.inkDark;
  return (
    <View style={{ flexDirection: 'row', gap: 14, paddingBottom: last ? 0 : 14 }}>
      <View style={{ width: 16, alignItems: 'center' }}>
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 999,
            backgroundColor: dotColor,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {state === 'done' && (
            <Svg width={10} height={10} viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M3 7l3 3 5-6" />
            </Svg>
          )}
          {state === 'rejected' && (
            <Svg width={9} height={9} viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round">
              <Path d="M3 3l8 8M11 3l-8 8" />
            </Svg>
          )}
        </View>
        {!last && <View style={{ flex: 1, width: 2, backgroundColor: state === 'done' ? tokens.inkDark : 'rgba(20,20,20,0.12)', marginTop: 2 }} />}
      </View>
      <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: titleColor, paddingTop: -1 }}>{label}</Text>
    </View>
  );
}
