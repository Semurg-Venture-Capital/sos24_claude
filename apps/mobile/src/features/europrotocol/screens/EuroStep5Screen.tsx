import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useVehicles } from '../../../api/vehicles';
import { usePolicies } from '../../../api/policies';
import { upsertDocument } from '../../../api/documents';
import {
  participantFullName,
  uploadEuroMedia,
  useSubmitEuroProtocol,
} from '../../../api/europrotocol';
import { Checkbox } from '../../../components/ui/Checkbox';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { SummaryBlock } from '../../../components/ui/SummaryBlock';
import { WizardFrame } from '../../../components/ui/WizardFrame';
import { tokens } from '../../../theme/colors';
import { REQUIRED_PHOTOS, useEuroStore, type PhotoKey } from '../store';
import { damagePartsText } from '../components/DamagePartsPicker';
import type { EuroStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<EuroStackParamList, 'EuroStep5'>;

function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return d && m && y ? `${d}.${m}.${y}` : iso;
}

// M9.3 шаг 5 — итоговый просмотр + подтверждение + отправка.
export function EuroStep5Screen() {
  const nav = useNavigation<Nav>();
  const s = useEuroStore();
  const { data: vehicles } = useVehicles();
  const { data: myPolicies } = usePolicies();
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState('');

  const myVehicle = vehicles?.find((v) => v.id === s.myVehicleId);
  const myPolicy = myPolicies?.find((p) => p.id === s.myPolicyId);
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

      // Рисунок схемы ДТП (карта + машины) → MinIO; ключ попадёт в PDF бланка.
      let schemeImageKey: string | undefined;
      if (s.schemeImageUri) {
        try {
          const { key } = await uploadEuroMedia(s.schemeImageUri, 'image');
          schemeImageKey = key;
        } catch {
          /* не блокируем отправку, если схему загрузить не удалось */
        }
      }

      // ВУ стороны A заполнено в шаге 2 (в профиле его не было) → сохраняем в профиль,
      // чтобы оно попало в PDF извещения.
      if (s.myDlSeria.trim() && s.myDlNumber.trim() && s.myDlIssue) {
        try {
          await upsertDocument('license', {
            series: s.myDlSeria.trim(),
            number: s.myDlNumber.trim(),
            issuedAt: s.myDlIssue,
            categories: s.myDlCategories.trim() || undefined,
          });
        } catch {
          /* не блокируем отправку, если сохранить ВУ не удалось */
        }
      }

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
        schemeImageKey,
        description: s.description || undefined,
        photos,
        // общая часть
        medCheck: s.medCheck ?? undefined,
        witnesses: s.witnesses || undefined,
        officialRegistered: s.officialRegistered ?? undefined,
        officerBadgeNo: s.officerBadgeNo || undefined,
        // обстоятельства
        circumstancesA: s.circumstancesA,
        circumstancesB: s.circumstancesB,
        // сторона A
        damageDescA: [damagePartsText(s.damagePartsA), s.damageDescA.trim()].filter(Boolean).join('. ') || undefined,
        objectionsA: s.objectionsA || undefined,
        impactZoneA: s.impactZoneA.length ? s.impactZoneA.join(',') : undefined,
        ownershipDocA: s.ownershipDocA || undefined,
        // сторона B
        otherOwnerAddr: s.otherOwnerAddr || undefined,
        otherOwnershipDoc: s.otherOwnershipDoc || undefined,
        impactZoneB: s.impactZoneB.length ? s.impactZoneB.join(',') : undefined,
        otherDlSeria: s.otherDlSeria || undefined,
        otherDlNumber: s.otherDlNumber || undefined,
        otherDlCategories: s.otherDlCategories || undefined,
        otherDlIssue: s.otherDlIssue || undefined,
        otherInsurer: s.otherInsurer || undefined,
        otherPolicyValidUntil: s.otherPolicyValidUntil || undefined,
        damageDescB: [damagePartsText(s.damagePartsB), s.damageDescB.trim()].filter(Boolean).join('. ') || undefined,
        objectionsB: s.objectionsB || undefined,
        // оборот
        driverRole: s.driverRole ?? undefined,
        canMove: s.canMove ?? undefined,
        cannotMovePlace: s.cannotMovePlace || undefined,
        remarks: s.remarks || undefined,
        remarksAudioKey: s.remarksAudioKey || undefined,
        remarksRaw: s.remarksRaw || undefined,
      });

      // Подпись стороны «В» фиксируется автоматически на бэкенде по факту прохождения MyID
      // вторым участником (signedBAt при submit). Отдельный OTP-шаг не нужен.

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
          { label: 'Схема', value: s.schemeImageUri ? 'на карте ✓' : '—' },
          { label: 'Фото / видео', value: `${photosCount} из ${REQUIRED_PHOTOS.length} · ${s.videos.length} видео` },
          { label: 'Обстоятельства', value: circCount ? `отмечено ${circCount}` : '—' },
        ]}
      />

      <SummaryBlock
        eyebrow="Сторона A · Вы"
        rows={[
          { label: 'Авто', value: myVehicle ? `${myVehicle.brand} ${myVehicle.model}` : '—' },
          { label: 'Госномер', value: myVehicle?.plate ?? '—' },
          { label: 'ОСАГО', value: myPolicy ? `${myPolicy.policyNumber ?? myPolicy.id.slice(0, 8)}` : '—' },
          { label: 'ВУ', value: s.myDlNumber ? `${s.myDlSeria} ${s.myDlNumber}`.trim() : 'из профиля' },
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
              s.otherPolicySeria || s.otherPolicyNumber
                ? `${s.otherPolicySeria} ${s.otherPolicyNumber}`.trim() + (s.otherPolicyValid ? ' ✓' : '')
                : '—',
          },
          { label: 'Телефон', value: s.otherPhone || '—' },
          {
            label: 'ВУ',
            value: s.otherDlSeria || s.otherDlNumber ? `${s.otherDlSeria} ${s.otherDlNumber}`.trim() : '—',
          },
          { label: 'Подпись', value: s.participant ? 'MyID ✓' : '—' },
        ]}
      />

      {s.description ? (
        <SummaryBlock eyebrow="Описание" rows={[{ label: '', value: s.description }]} />
      ) : null}

      {/* Подпись стороны «В» по OTP */}
      {s.participant ? (
        <View style={{ gap: 6 }}>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.inkMuted, letterSpacing: -0.07 }}>
            Подпись второго участника
          </Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkSubtle, lineHeight: 16 }}>
            ✓ Подтверждено через MyID — это считается подписью и согласием второго участника.
          </Text>
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
