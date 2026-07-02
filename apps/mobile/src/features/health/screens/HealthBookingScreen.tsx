import { useEffect, useMemo, useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../../theme/colors';
import type { HealthStackParamList } from '../../../navigation/types';
import { Avatar } from '../../../components/ui/Avatar';
import { BackButton } from '../../../components/ui/BackButton';
import { RedButton } from '../../../components/ui/RedButton';
import { createAppointment, fetchDoctorSlots, useDoctor, type DoctorSlot } from '../../../api/health';
import { medGlass } from '../components';

type Nav = NativeStackNavigationProp<HealthStackParamList, 'HealthBooking'>;
type Rt = RouteProp<HealthStackParamList, 'HealthBooking'>;

const WEEKDAY_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTH_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function HealthBookingScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { doctorId } = params;
  const { data: doctor } = useDoctor(doctorId);

  const days = useMemo(() => {
    const arr: Date[] = [];
    const base = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  const [date, setDate] = useState<Date>(days[0]);
  const [slots, setSlots] = useState<DoctorSlot[]>([]);
  const [slotIso, setSlotIso] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoadingSlots(true);
    setSlotIso(null);
    fetchDoctorSlots(doctorId, dateKey(date))
      .then((s) => {
        if (alive) setSlots(s);
      })
      .finally(() => {
        if (alive) setLoadingSlots(false);
      });
    return () => {
      alive = false;
    };
  }, [doctorId, date]);

  const canSubmit = slotIso != null && !submitting;

  const submit = async () => {
    if (!slotIso || !doctor) return;
    setSubmitting(true);
    try {
      const appt = await createAppointment({ doctorId, scheduledAt: slotIso, comment: reason.trim() || undefined });
      nav.replace('HealthBookingDone', {
        doctorName: appt.doctorName,
        specialty: appt.specialty,
        clinicName: appt.clinicName,
        scheduledAt: appt.scheduledAt,
      });
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg || 'Не удалось создать запись');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.pageBg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 }}>
        <BackButton onPress={() => nav.goBack()} />
        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 18, color: tokens.ink }}>Запись на приём</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, gap: 22 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Мини-карточка врача */}
        {doctor ? (
          <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 22 }, medGlass]}>
            <Avatar name={doctor.fullName} size={44} />
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: tokens.ink }}>{doctor.fullName}</Text>
              <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12.5, color: tokens.inkMuted }}>
                {doctor.specialty}
                {doctor.clinic ? ` · ${doctor.clinic.name}` : ''}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Дата */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.inkMuted }}>Дата</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {days.map((d) => {
              const on = dateKey(d) === dateKey(date);
              return (
                <Pressable
                  key={dateKey(d)}
                  onPress={() => setDate(d)}
                  style={{
                    width: 60,
                    paddingVertical: 12,
                    borderRadius: 16,
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: on ? tokens.inkDark : tokens.glass,
                    borderWidth: on ? 0 : 1,
                    borderColor: tokens.hairline,
                  }}
                >
                  <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 11, color: on ? 'rgba(255,255,255,0.7)' : tokens.inkMuted }}>
                    {WEEKDAY_SHORT[d.getDay()]}
                  </Text>
                  <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 18, color: on ? '#fff' : tokens.ink }}>{d.getDate()}</Text>
                  <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 10, color: on ? 'rgba(255,255,255,0.7)' : tokens.inkMuted }}>
                    {MONTH_SHORT[d.getMonth()]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Время */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.inkMuted }}>Время</Text>
          {loadingSlots ? (
            <ActivityIndicator color={tokens.red} style={{ alignSelf: 'flex-start' }} />
          ) : slots.length === 0 ? (
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted }}>
              В этот день врач не принимает
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {slots.map((s) => {
                const on = s.iso === slotIso;
                return (
                  <Pressable
                    key={s.iso}
                    disabled={!s.available}
                    onPress={() => setSlotIso(s.iso)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: on ? tokens.red : s.available ? tokens.glass : 'transparent',
                      borderWidth: 1,
                      borderColor: on ? tokens.red : tokens.hairline,
                      opacity: s.available ? 1 : 0.35,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Manrope_600SemiBold',
                        fontSize: 13,
                        color: on ? '#fff' : tokens.ink,
                        textDecorationLine: s.available ? 'none' : 'line-through',
                      }}
                    >
                      {s.time}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Причина обращения */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.inkMuted }}>Причина обращения</Text>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: tokens.hairline, padding: 14, minHeight: 80 }}>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Опишите симптомы…"
              placeholderTextColor={tokens.inkMuted}
              multiline
              style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.ink }}
            />
          </View>
        </View>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 32,
          backgroundColor: 'rgba(237,237,237,0.96)',
          borderTopWidth: 1,
          borderTopColor: tokens.hairline,
        }}
      >
        <RedButton trailing={false} onPress={submit} disabled={!canSubmit}>
          {submitting ? 'Создаём…' : 'Подтвердить запись'}
        </RedButton>
      </View>
    </SafeAreaView>
  );
}
