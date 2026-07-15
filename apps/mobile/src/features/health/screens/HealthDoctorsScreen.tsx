import { useEffect, useRef, useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../../../theme/colors';
import type { HealthStackParamList } from '../../../navigation/types';
import { BackButton } from '../../../components/ui/BackButton';
import { Glass } from '../../../components/ui/Glass';
import { MapPinIcon } from '../../../components/icons/MedIcons';
import { useDoctors, useRegions, type DoctorCard } from '../../../api/health';
import { useGeoStore } from '../../../stores/geoStore';
import { LiquidGlassChips, MedCardSkeletonList, MedDoctorCard } from '../components';

type Nav = NativeStackNavigationProp<HealthStackParamList, 'HealthDoctors'>;
type Rt = RouteProp<HealthStackParamList, 'HealthDoctors'>;

const ALL = '__all';
const money = (n: number | null) => (n != null ? `${n.toLocaleString('ru-RU')} сум` : '—');

export function HealthDoctorsScreen() {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [headerH, setHeaderH] = useState(insets.top + 54);
  const { params } = useRoute<Rt>();
  const [q, setQ] = useState('');
  const [specialty, setSpecialty] = useState<string | null>(params?.specialty ?? null);

  // Область: дефолт из гео (по GPS), пользователь может сменить.
  const geoRegion = useGeoStore((s) => s.region);
  const [region, setRegion] = useState<string | null>(geoRegion);
  const touched = useRef(false);
  useEffect(() => {
    if (!touched.current && geoRegion) setRegion(geoRegion);
  }, [geoRegion]);
  const pickRegion = (r: string | null) => {
    touched.current = true;
    setRegion(r);
  };

  const chips = useDoctors({}); // стабильный список специальностей
  const list = useDoctors({ q: q.trim() || undefined, specialty: specialty || undefined, region: region || undefined });
  const { data: regions = [] } = useRegions();

  const specialties = chips.data?.specialties ?? [];
  const doctors = list.data?.doctors ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: tokens.pageBg }}>
      {/* Контент стартует под фикс-хедером; чипы липнут к его нижнему краю. */}
      <View style={{ flex: 1, paddingTop: headerH }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140 }}
        stickyHeaderIndices={[1]}
        keyboardShouldPersistTaps="handled"
      >
        {/* [0] Поиск — уезжает под хедер при скролле */}
        <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 }}>
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

        {/* [1] Липкие чипы — полупрозрачное стекло, контент виден под ними */}
        <Glass intensity={26} tint="light" style={{ paddingBottom: 6 }}>
          <LiquidGlassChips
            items={[{ key: ALL, label: 'Все области' }, ...regions.map((r) => ({ key: r, label: r }))]}
            selectedKey={region ?? ALL}
            onSelect={(k) => pickRegion(k === ALL ? null : k)}
          />
          <View style={{ paddingTop: 4 }}>
            <LiquidGlassChips
              items={[{ key: ALL, label: 'Все' }, ...specialties.map((s) => ({ key: s, label: s }))]}
              selectedKey={specialty ?? ALL}
              onSelect={(k) => setSpecialty(k === ALL ? null : k)}
            />
          </View>
        </Glass>

        {/* [2] Результаты */}
        <View style={{ paddingHorizontal: 24, paddingTop: 14, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MapPinIcon size={13} />
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12.5, color: tokens.inkMuted }}>
            {region ? `Область: ${region}` : 'Все области'} · {doctors.length} врачей
          </Text>
        </View>

        {list.isLoading ? (
          <MedCardSkeletonList count={5} />
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
              bookingEnabled={d.bookingEnabled}
              workplace={[d.clinic?.name, d.clinic?.city].filter(Boolean).join(' · ')}
              onPress={() => nav.navigate('HealthDoctorProfile', { id: d.id })}
              onBook={() => nav.navigate('HealthBooking', { doctorId: d.id })}
              onCall={() => d.phone && void Linking.openURL(`tel:${d.phone}`)}
            />
          ))
        )}
        </View>
      </ScrollView>
      </View>

      {/* Фиксированный полупрозрачный хедер — измеряем высоту → отступ контента; чипы липнут под ним */}
      <View onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <Glass intensity={26} tint="light">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingTop: insets.top + 8, paddingBottom: 10 }}>
            <BackButton onPress={() => nav.goBack()} />
            <Text style={{ flex: 1, fontFamily: 'Manrope_600SemiBold', fontSize: 18, color: tokens.ink }}>Врачи</Text>
            <Pressable onPress={() => nav.navigate('HealthClinics')} hitSlop={8} style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: tokens.glass, borderWidth: 1, borderColor: tokens.hairline }}>
              <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.inkDark }}>Клиники →</Text>
            </Pressable>
          </View>
        </Glass>
      </View>
    </View>
  );
}

