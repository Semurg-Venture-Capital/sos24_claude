import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useVehicles } from '../../../api/vehicles';
import { participantFullName, useSubmitEuroProtocol } from '../../../api/europrotocol';
import { Checkbox } from '../../../components/ui/Checkbox';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { SummaryBlock } from '../../../components/ui/SummaryBlock';
import { WizardFrame } from '../../../components/ui/WizardFrame';
import { tokens } from '../../../theme/colors';
import { REQUIRED_PHOTOS, useEuroStore } from '../store';
import type { EuroStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<EuroStackParamList, 'EuroStep5'>;

const SCHEME_LABEL = { rear: 'Наезд сзади', front: 'Лобовое', side: 'Боковое' } as const;

function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return d && m && y ? `${d}.${m}.${y}` : iso;
}

// M9.3 шаг 5 — итоговый просмотр + подтверждение + отправка.
export function EuroStep5Screen() {
  const nav = useNavigation<Nav>();
  const s = useEuroStore();
  const { data: vehicles } = useVehicles();
  const [confirmed, setConfirmed] = useState(false);

  const myVehicle = vehicles?.find((v) => v.id === s.myVehicleId);
  const photosCount = REQUIRED_PHOTOS.filter((k) => s.photos[k]).length;
  const submitMutation = useSubmitEuroProtocol();

  const submit = () => {
    submitMutation.mutate(
      {
        incidentDate: s.date,
        incidentTime: s.time,
        place: s.place,
        lat: s.lat,
        lng: s.lng,
        vehicleId: s.myVehicleId,
        selfVerified: s.selfVerified,
        participantId: s.participant?.id,
        otherGov: s.otherGov || undefined,
        otherPhone: s.otherPhone || undefined,
        otherVehicleRaw: (s.otherVehicle as unknown as Record<string, unknown>) ?? undefined,
        otherPolicySeria: s.otherPolicySeria || undefined,
        otherPolicyNumber: s.otherPolicyNumber || undefined,
        otherPolicyValid: s.otherPolicyValid ?? undefined,
        schemeType: s.schemeType ?? undefined,
        description: s.description || undefined,
        photos: REQUIRED_PHOTOS.filter((k) => s.photos[k]).map((k) => ({ key: k, at: s.photos[k]?.at })),
      },
      {
        onSuccess: (res) => {
          s.setSubmittedNumber(res.number);
          nav.navigate('EuroSuccess');
        },
        onError: () => Alert.alert('Ошибка', 'Не удалось отправить европротокол. Попробуйте ещё раз.'),
      },
    );
  };

  return (
    <WizardFrame
      step={5}
      total={5}
      eyebrow="Шаг 5 из 5 · Подтверждение"
      primary={submitMutation.isPending ? 'Отправка…' : 'Подписать и отправить'}
      primaryEnabled={confirmed && !submitMutation.isPending}
      primaryAction={submit}
      onBack={() => nav.goBack()}
    >
      <ScreenHeading title="Проверьте данные" subtitle="Перед отправкой убедитесь, что всё верно" />

      <SummaryBlock
        eyebrow="Обстоятельства"
        rows={[
          { label: 'Дата и время', value: `${formatDate(s.date)} · ${s.time}` },
          { label: 'Место', value: s.place || '—' },
          { label: 'Схема', value: s.schemeType ? SCHEME_LABEL[s.schemeType] : '—' },
          { label: 'Фото', value: `${photosCount} из ${REQUIRED_PHOTOS.length}` },
        ]}
      />

      <SummaryBlock
        eyebrow="Сторона A · Вы"
        rows={[
          { label: 'Авто', value: myVehicle ? `${myVehicle.brand} ${myVehicle.model}` : '—' },
          { label: 'Госномер', value: myVehicle?.plate ?? '—' },
          { label: 'MyID', value: s.selfVerified ? 'Подтверждён' : 'Нет' },
        ]}
      />

      <SummaryBlock
        eyebrow="Сторона B · Второй участник"
        rows={[
          { label: 'Участник', value: s.participant ? participantFullName(s.participant) : '—' },
          { label: 'Авто', value: s.otherVehicle?.modelName ?? '—' },
          { label: 'Госномер', value: s.otherVehicle?.govNumber ?? s.otherGov ?? '—' },
          {
            label: 'Полис',
            value:
              s.otherPolicySeria && s.otherPolicyNumber
                ? `${s.otherPolicySeria} ${s.otherPolicyNumber}${s.otherPolicyValid ? ' ✓' : ''}`
                : '—',
          },
        ]}
      />

      {s.description ? (
        <SummaryBlock eyebrow="Описание" rows={[{ label: '', value: s.description }]} />
      ) : null}

      {/* Подтверждение */}
      <Pressable
        onPress={() => setConfirmed((v) => !v)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          padding: 16,
          borderRadius: 20,
          backgroundColor: 'rgba(255,255,255,0.55)',
          borderWidth: 1,
          borderColor: tokens.hairline,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Checkbox checked={confirmed} onChange={() => setConfirmed((v) => !v)} />
        <Text style={{ flex: 1, fontFamily: 'Manrope_500Medium', fontSize: 14, lineHeight: 19, color: tokens.ink }}>
          Подтверждаю, что все данные верны и оба участника согласны с обстоятельствами ДТП
        </Text>
      </Pressable>

      <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkSubtle, lineHeight: 17, paddingHorizontal: 4 }}>
        Обе личности подтверждены через MyID. После отправки извещение поступит в обработку — следите за статусом в разделе «Заявления».
      </Text>
    </WizardFrame>
  );
}
