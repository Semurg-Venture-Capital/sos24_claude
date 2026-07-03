import { useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../../theme/colors';
import type { HealthStackParamList } from '../../../navigation/types';
import { BackButton } from '../../../components/ui/BackButton';
import { MapPinIcon } from '../../../components/icons/MedIcons';
import { useDoctors, type DoctorCard } from '../../../api/health';
import { MedDoctorCard } from '../components';

type Nav = NativeStackNavigationProp<HealthStackParamList, 'HealthDoctors'>;
type Rt = RouteProp<HealthStackParamList, 'HealthDoctors'>;

const money = (n: number | null) => (n != null ? `${n.toLocaleString('ru-RU')} сум` : '—');

export function HealthDoctorsScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const [q, setQ] = useState('');
  const [specialty, setSpecialty] = useState<string | null>(params?.specialty ?? null);

  const chips = useDoctors({}); // стабильный список специальностей
  const list = useDoctors({ q: q.trim() || undefined, specialty: specialty || undefined });

  const specialties = chips.data?.specialties ?? [];
  const doctors = list.data?.doctors ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.pageBg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 }}>
        <BackButton onPress={() => nav.goBack()} />
        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 18, color: tokens.ink }}>Врачи и клиники</Text>
      </View>

      {/* Поиск */}
      <View style={{ paddingHorizontal: 24 }}>
        <View
          style={{
            height: 52,
            paddingHorizontal: 18,
            borderRadius: 999,
            backgroundColor: tokens.glass,
            borderWidth: 1,
            borderColor: tokens.hairline,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Врач, специальность, клиника"
            placeholderTextColor={tokens.inkMuted}
            style={{ flex: 1, fontFamily: 'Manrope_400Regular', fontSize: 15, color: tokens.ink }}
          />
        </View>
      </View>

      {/* Фильтр-чипы */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 24, paddingTop: 16 }}
        style={{ flexGrow: 0 }}
      >
        <FilterChip label="Все" active={specialty == null} onPress={() => setSpecialty(null)} />
        {specialties.map((s) => (
          <FilterChip key={s} label={s} active={specialty === s} onPress={() => setSpecialty(s)} />
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 140, gap: 14 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MapPinIcon size={13} />
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12.5, color: tokens.inkMuted }}>
            Партнёрские клиники · Ташкент
          </Text>
        </View>

        {list.isLoading ? (
          <ActivityIndicator color={tokens.red} style={{ marginTop: 24 }} />
        ) : doctors.length === 0 ? (
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted, marginTop: 16 }}>
            Никого не нашли. Измените запрос или фильтр.
          </Text>
        ) : (
          doctors.map((d: DoctorCard) => (
            <MedDoctorCard
              key={d.id}
              name={d.fullName}
              specialty={d.specialty}
              experience={d.experienceY != null ? `${d.experienceY} лет` : undefined}
              rating={d.rating.toFixed(1)}
              reviews={`${d.reviewCount} отзывов`}
              price={money(d.pricePrimary)}
              video={d.videoEnabled}
              verified={d.verified}
              onPress={() => nav.navigate('HealthDoctorProfile', { id: d.id })}
              onBook={() => nav.navigate('HealthBooking', { doctorId: d.id })}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 9,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: active ? tokens.inkDark : tokens.glass,
        borderWidth: active ? 0 : 1,
        borderColor: tokens.hairline,
      }}
    >
      <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: active ? '#fff' : tokens.inkDark }}>{label}</Text>
    </Pressable>
  );
}
