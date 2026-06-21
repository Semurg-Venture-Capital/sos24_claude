import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { createBooking, fetchSlots, usePartnerDetail, type Slot } from '../../../api/partners';
import { BackButton } from '../../../components/ui/BackButton';
import { Glass } from '../../../components/ui/Glass';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { tokens } from '../../../theme/colors';
import type { PartnersStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<PartnersStackParamList, 'PartnerBooking'>;
type Rt = RouteProp<PartnersStackParamList, 'PartnerBooking'>;

const WEEKDAY_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTH_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function PartnerBookingScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { partnerId, partnerName } = params;
  const { data: partner } = usePartnerDetail(partnerId);

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

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [date, setDate] = useState<Date>(days[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotIso, setSlotIso] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoadingSlots(true);
    setSlotIso(null);
    fetchSlots(partnerId, dateKey(date), selectedServices[0])
      .then((s) => {
        if (alive) setSlots(s);
      })
      .finally(() => {
        if (alive) setLoadingSlots(false);
      });
    return () => {
      alive = false;
    };
  }, [partnerId, date, selectedServices]);

  const toggleService = (id: string) =>
    setSelectedServices((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const canSubmit = slotIso != null && !submitting;

  const submit = async () => {
    if (!slotIso) return;
    setSubmitting(true);
    try {
      await createBooking(partnerId, {
        serviceIds: selectedServices.length ? selectedServices : undefined,
        scheduledAt: slotIso,
        comment: comment.trim() || undefined,
      });
      nav.replace('PartnerBookingSuccess', { partnerName, scheduledAt: slotIso });
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg || 'Не удалось создать запись');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PhoneFrame>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 }}>
        <BackButton onPress={() => nav.goBack()} />
        <Text numberOfLines={1} style={{ flex: 1, fontFamily: 'NeueMontreal-Medium', fontSize: 22, letterSpacing: -0.22, color: tokens.ink }}>
          Запись в {partnerName}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, gap: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Услуги */}
        {partner && partner.services.length > 0 && (
          <View style={{ gap: 10 }}>
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.inkMuted }}>Выберите услуги</Text>
            {partner.services.map((s) => {
              const on = selectedServices.includes(s.id);
              return (
                <Pressable key={s.id} onPress={() => toggleService(s.id)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                  <Glass intensity={20} tint="light" style={{ backgroundColor: on ? 'rgba(230,20,40,0.06)' : tokens.glass, borderRadius: 16, borderWidth: 1, borderColor: on ? tokens.red : tokens.hairline, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: on ? tokens.red : tokens.hairline, backgroundColor: on ? tokens.red : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                      {on && <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>✓</Text>}
                    </View>
                    <Text style={{ flex: 1, fontFamily: 'Manrope_500Medium', fontSize: 14, color: tokens.ink }}>{s.name}</Text>
                    {s.priceFrom != null && <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: tokens.inkDark }}>от {s.priceFrom.toLocaleString('ru-RU')}</Text>}
                  </Glass>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Дата */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.inkMuted }}>Дата</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {days.map((d) => {
              const on = dateKey(d) === dateKey(date);
              return (
                <Pressable
                  key={dateKey(d)}
                  onPress={() => setDate(d)}
                  style={{ width: 60, paddingVertical: 12, borderRadius: 16, alignItems: 'center', gap: 4, backgroundColor: on ? tokens.inkDark : tokens.glass, borderWidth: on ? 0 : 1, borderColor: tokens.hairline }}
                >
                  <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 11, color: on ? 'rgba(255,255,255,0.7)' : tokens.inkMuted }}>{WEEKDAY_SHORT[d.getDay()]}</Text>
                  <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 18, color: on ? '#fff' : tokens.ink }}>{d.getDate()}</Text>
                  <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 10, color: on ? 'rgba(255,255,255,0.7)' : tokens.inkMuted }}>{MONTH_SHORT[d.getMonth()]}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Слоты */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.inkMuted }}>Время</Text>
          {loadingSlots ? (
            <ActivityIndicator color={tokens.red} style={{ alignSelf: 'flex-start' }} />
          ) : slots.length === 0 ? (
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted }}>В этот день нет свободного времени</Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {slots.map((s) => {
                const on = s.iso === slotIso;
                return (
                  <Pressable
                    key={s.iso}
                    disabled={!s.available}
                    onPress={() => setSlotIso(s.iso)}
                    style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: on ? tokens.red : s.available ? tokens.glass : 'transparent', borderWidth: 1, borderColor: on ? tokens.red : tokens.hairline, opacity: s.available ? 1 : 0.35 }}
                  >
                    <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: on ? '#fff' : tokens.ink, textDecorationLine: s.available ? 'none' : 'line-through' }}>{s.time}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Комментарий */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.inkMuted }}>Комментарий (необязательно)</Text>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: tokens.hairline, padding: 14, minHeight: 80 }}>
            <TextInput value={comment} onChangeText={setComment} placeholder="Опишите задачу…" placeholderTextColor={tokens.inkMuted} multiline style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.ink }} />
          </View>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32, backgroundColor: 'rgba(237,237,237,0.96)', borderTopWidth: 1, borderTopColor: tokens.hairline }}>
        <RedButton onPress={submit} disabled={!canSubmit}>
          {submitting ? 'Создаём…' : 'Подтвердить запись'}
        </RedButton>
      </View>
    </PhoneFrame>
  );
}
