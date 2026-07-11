import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, Linking, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../../theme/colors';
import type { HealthStackParamList } from '../../../navigation/types';
import { BackButton } from '../../../components/ui/BackButton';
import { RedButton } from '../../../components/ui/RedButton';
import { MapPinIcon } from '../../../components/icons/MedIcons';
import { StarIcon } from '../../../components/icons/StarIcon';
import { useClinic } from '../../../api/health';
import { MedDoctorCard, MedSectionLabel } from '../components';

type Nav = NativeStackNavigationProp<HealthStackParamList, 'HealthClinicProfile'>;
type Rt = RouteProp<HealthStackParamList, 'HealthClinicProfile'>;

const money = (n: number | null) => (n != null ? `${n.toLocaleString('ru-RU')} сум` : '—');

export function HealthClinicProfileScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { data: c, isLoading } = useClinic(params.id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.pageBg }} edges={['top']}>
      <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
        <BackButton onPress={() => nav.goBack()} />
      </View>

      {isLoading || !c ? (
        <ActivityIndicator color={tokens.red} style={{ marginTop: 48 }} />
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 130, gap: 18 }}>
            <View style={{ gap: 8 }}>
              <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 24, letterSpacing: -0.24, color: tokens.ink }}>{c.name}</Text>
              {c.category ? <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted }}>{c.category}</Text> : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MapPinIcon size={14} />
                <Text style={{ flex: 1, fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted }}>
                  {[c.address, c.region ?? c.city].filter(Boolean).join(', ')}
                </Text>
              </View>
              {c.rating > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <StarIcon size={14} />
                  <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: tokens.ink }}>{c.rating.toFixed(1)}</Text>
                  <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted }}>· {c.reviewCount} отзывов</Text>
                </View>
              ) : null}
            </View>

            {c.doctors.length > 0 ? (
              <View style={{ gap: 12 }}>
                <MedSectionLabel>{`Врачи клиники · ${c.doctors.length}`}</MedSectionLabel>
                {c.doctors.map((d) => (
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
                ))}
              </View>
            ) : null}
          </ScrollView>

          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32, backgroundColor: 'rgba(237,237,237,0.96)', borderTopWidth: 1, borderTopColor: tokens.hairline }}>
            <RedButton trailing={false} onPress={() => c.phone && void Linking.openURL(`tel:${c.phone}`)}>
              Позвонить{c.phone ? ` · ${c.phone}` : ''}
            </RedButton>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
