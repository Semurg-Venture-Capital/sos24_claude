import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, Linking, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../../theme/colors';
import type { HealthStackParamList } from '../../../navigation/types';
import { Avatar } from '../../../components/ui/Avatar';
import { BackButton } from '../../../components/ui/BackButton';
import { RedButton } from '../../../components/ui/RedButton';
import { StarIcon } from '../../../components/icons/StarIcon';
import { BadgeCheckIcon } from '../../../components/icons/MedIcons';
import { useDoctor } from '../../../api/health';
import { MedCardRow, MedSectionLabel, medGlass } from '../components';

type Nav = NativeStackNavigationProp<HealthStackParamList, 'HealthDoctorProfile'>;
type Rt = RouteProp<HealthStackParamList, 'HealthDoctorProfile'>;

export function HealthDoctorProfileScreen() {
  const { t } = useTranslation();
  const money = (n: number) => `${n.toLocaleString('ru-RU')} ${t('health.currency')}`;
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { data: d, isLoading } = useDoctor(params.id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.pageBg }} edges={['top']}>
      <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
        <BackButton onPress={() => nav.goBack()} />
      </View>

      {isLoading || !d ? (
        <ActivityIndicator color={tokens.red} style={{ marginTop: 48 }} />
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 140, gap: 20 }}>
            {/* Шапка врача */}
            <View style={{ alignItems: 'center', gap: 12 }}>
              <View>
                <Avatar name={d.fullName} size={92} />
                {d.verified ? (
                  <View
                    style={{
                      position: 'absolute',
                      right: 0,
                      bottom: 2,
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      backgroundColor: '#fff',
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#000',
                      shadowOpacity: 0.18,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 2 },
                    }}
                  >
                    <BadgeCheckIcon size={17} color={tokens.blue} />
                  </View>
                ) : null}
              </View>
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 24, letterSpacing: -0.24, color: tokens.ink }}>
                  {d.fullName}
                </Text>
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted }}>{d.specialty}</Text>
              </View>
              {d.verified ? (
                <View style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(105,228,183,0.4)' }}>
                  <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: '#0a3a26' }}>{t('health.doctorProfile.partnerBadge')}</Text>
                </View>
              ) : null}
            </View>

            {/* Статы (рейтинг — только для врачей с записью) */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {d.bookingEnabled ? <StatBox value={d.rating.toFixed(1)} label={t('health.doctor.reviews', { count: d.reviewCount })} star /> : null}
              {d.experienceY != null ? <StatBox value={t('health.doctor.years', { count: d.experienceY })} label={t('health.doctorProfile.experienceLabel')} /> : null}
              {d.clinic ? (
                <StatBox value={d.clinic.name.replace(/^Клиника\s*/, '').replace(/[«»]/g, '') || d.clinic.city || t('health.doctorProfile.clinicFallback')} label={d.clinic.city ?? t('health.doctorProfile.workplaceLabel')} />
              ) : null}
            </View>

            {/* О враче */}
            {d.bio ? (
              <View style={{ gap: 8 }}>
                <MedSectionLabel>{t('health.doctorProfile.about')}</MedSectionLabel>
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, lineHeight: 22, color: tokens.ink }}>{d.bio}</Text>
              </View>
            ) : null}

            {/* Услуги и цены */}
            {d.services.length > 0 ? (
              <View style={{ gap: 10 }}>
                <MedSectionLabel>{t('health.doctorProfile.services')}</MedSectionLabel>
                {d.services.map((s) => (
                  <MedCardRow key={s.label} label={s.label} value={money(s.price)} valueColor={s.accent ? '#1a3577' : undefined} />
                ))}
              </View>
            ) : null}
          </ScrollView>

          {/* Sticky CTA */}
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
            {d.bookingEnabled ? (
              <RedButton trailing={false} onPress={() => nav.navigate('HealthBooking', { doctorId: d.id })}>
                {t('health.doctorProfile.bookInPerson')}
              </RedButton>
            ) : (
              <RedButton trailing={false} onPress={() => d.phone && void Linking.openURL(`tel:${d.phone}`)}>
                {t('health.doctor.call')}{d.phone ? ` · ${d.phone}` : ''}
              </RedButton>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function StatBox({ value, label, star }: { value: string; label: string; star?: boolean }) {
  return (
    <View style={[{ flex: 1, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 18, alignItems: 'center', gap: 4 }, medGlass]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {star ? <StarIcon size={14} /> : null}
        <Text numberOfLines={1} style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 17, color: tokens.ink }}>
          {value}
        </Text>
      </View>
      <Text numberOfLines={1} style={{ fontFamily: 'Manrope_400Regular', fontSize: 11, color: tokens.inkMuted }}>
        {label}
      </Text>
    </View>
  );
}
