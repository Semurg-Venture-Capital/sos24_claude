import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useVehicles } from '../../../api/vehicles';
import {
  participantFullName,
  signOtherParty,
  uploadEuroMedia,
  useSubmitEuroProtocol,
} from '../../../api/europrotocol';
import { Checkbox } from '../../../components/ui/Checkbox';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { SummaryBlock } from '../../../components/ui/SummaryBlock';
import { TextField } from '../../../components/ui/TextField';
import { WizardFrame } from '../../../components/ui/WizardFrame';
import { tokens } from '../../../theme/colors';
import { REQUIRED_PHOTOS, useEuroStore, type PhotoKey } from '../store';
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
  const [otpB, setOtpB] = useState('');
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState('');

  const myVehicle = vehicles?.find((v) => v.id === s.myVehicleId);
  const photosCount = REQUIRED_PHOTOS.filter((k) => s.photos[k]).length;
  const circCount = s.circumstancesA.filter(Boolean).length + s.circumstancesB.filter(Boolean).length;
  const submitMutation = useSubmitEuroProtocol();

  // Заливает фото/видео в MinIO, возвращает массив метаданных (ключ + слот + время).
  const uploadMedia = async () => {
    const out: { key: string; slot?: string; at?: string; type: 'image' | 'video' }[] = [];
    const slots: PhotoKey[] = ['overview', 'myCar', 'otherCar', 'scene'];
    for (const slot of slots) {
      const ph = s.photos[slot];
      if (!ph?.uri) continue;
      try {
        const { key } = await uploadEuroMedia(ph.uri, 'image');
        out.push({ key, slot, at: ph.at, type: 'image' });
      } catch {
        /* не блокируем отправку из-за одного файла */
      }
    }
    for (const v of s.videos) {
      if (!v.uri) continue;
      try {
        const { key } = await uploadEuroMedia(v.uri, 'video');
        out.push({ key, at: v.at, type: 'video' });
      } catch {
        /* skip */
      }
    }
    return out;
  };

  const submit = async () => {
    setBusy(true);
    try {
      setPhase('Загрузка медиа…');
      const photos = await uploadMedia();

      setPhase('Отправка…');
      const res = await submitMutation.mutateAsync({
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
        photos,
        // общая часть
        medCheck: s.medCheck ?? undefined,
        witnesses: s.witnesses || undefined,
        officialRegistered: s.officialRegistered ?? undefined,
        // обстоятельства
        circumstancesA: s.circumstancesA,
        circumstancesB: s.circumstancesB,
        // сторона A
        damageDescA: s.damageDescA || undefined,
        objectionsA: s.objectionsA || undefined,
        // сторона B
        otherOwnerAddr: s.otherOwnerAddr || undefined,
        otherDlSeria: s.otherDlSeria || undefined,
        otherDlNumber: s.otherDlNumber || undefined,
        otherDlCategories: s.otherDlCategories || undefined,
        otherDlIssue: s.otherDlIssue || undefined,
        otherInsurer: s.otherInsurer || undefined,
        otherPolicyValidUntil: s.otherPolicyValidUntil || undefined,
        damageDescB: s.damageDescB || undefined,
        objectionsB: s.objectionsB || undefined,
        // оборот
        driverRole: s.driverRole ?? undefined,
        canMove: s.canMove ?? undefined,
        cannotMovePlace: s.cannotMovePlace || undefined,
        remarks: s.remarks || undefined,
      });

      // Подпись стороны «В» по OTP (если введён код)
      if (otpB.trim() && s.otherPhone) {
        setPhase('Подпись стороны В…');
        try {
          await signOtherParty(res.id, otpB.trim());
        } catch {
          /* подпись необязательна для отправки — оператор увидит статус */
        }
      }

      s.setSubmittedNumber(res.number);
      nav.navigate('EuroSuccess');
    } catch {
      Alert.alert('Ошибка', 'Не удалось отправить европротокол. Попробуйте ещё раз.');
    } finally {
      setBusy(false);
      setPhase('');
    }
  };

  return (
    <WizardFrame
      step={5}
      total={5}
      eyebrow="Шаг 5 из 5 · Подтверждение"
      primary={busy ? phase || 'Отправка…' : 'Подписать и отправить'}
      primaryEnabled={confirmed && !busy}
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
          { label: 'Фото / видео', value: `${photosCount} из ${REQUIRED_PHOTOS.length} · ${s.videos.length} видео` },
          { label: 'Обстоятельства', value: circCount ? `отмечено ${circCount}` : '—' },
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

      {/* Подпись стороны «В» по OTP */}
      {s.otherPhone ? (
        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.inkMuted, letterSpacing: -0.07 }}>
            Подпись второго участника
          </Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkSubtle, lineHeight: 16 }}>
            Код отправлен на {s.otherPhone}. Попросите второго участника продиктовать код для подписи.
          </Text>
          <TextField
            label="Код из SMS (необязательно)"
            value={otpB}
            onChangeText={setOtpB}
            keyboardType="number-pad"
            placeholder="••••"
          />
        </View>
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
