import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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

const money = (n: number | null, t: TFunction) => (n != null ? `${n.toLocaleString('ru-RU')} ${t('healthCard.units.sum')}` : '—');

// Компактная сводка графика: { mon:{open,close}, … } → "Пн–Сб · 09:00–16:00".
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
function formatHours(wh: Record<string, { open: string; close: string } | null> | null, t: TFunction): string | null {
  if (!wh) return null;
  const dayLabel = (k: string) => t(`healthCard.days.${k}`);
  const open = DAY_KEYS.filter((k) => wh[k]);
  if (open.length === 0) return null;
  const first = wh[open[0]]!;
  const same = open.every((k) => wh[k]!.open === first.open && wh[k]!.close === first.close);
  const days = open.length > 1 ? `${dayLabel(open[0])}–${dayLabel(open[open.length - 1])}` : dayLabel(open[0]);
  return same ? `${days} · ${first.open}–${first.close}` : open.map((k) => `${dayLabel(k)} ${wh[k]!.open}–${wh[k]!.close}`).join(', ');
}

export function HealthClinicProfileScreen() {
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();
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
                  <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted }}>· {t('healthCard.clinics.reviews', { count: c.reviewCount })}</Text>
                </View>
              ) : null}
              {formatHours(c.workingHours, t) ? (
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted }}>
                  🕘 {formatHours(c.workingHours, t)}
                </Text>
              ) : null}
            </View>

            {c.description ? (
              <View style={{ gap: 8 }}>
                <MedSectionLabel>{t('healthCard.clinics.about')}</MedSectionLabel>
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, lineHeight: 21, color: tokens.ink }}>
                  {c.description.trim()}
                </Text>
              </View>
            ) : null}

            {c.doctors.length > 0 ? (
              <View style={{ gap: 12 }}>
                <MedSectionLabel>{t('healthCard.clinics.doctorsTitle', { count: c.doctors.length })}</MedSectionLabel>
                {c.doctors.map((d) => (
                  <MedDoctorCard
                    key={d.id}
                    name={d.fullName}
                    specialty={d.specialty}
                    experience={d.experienceY != null ? t('healthCard.clinics.yearsExp', { years: d.experienceY }) : undefined}
                    rating={d.rating.toFixed(1)}
                    reviews={t('healthCard.clinics.reviews', { count: d.reviewCount })}
                    price={money(d.pricePrimary, t)}
                    video={d.videoEnabled}
                    verified={d.verified}
                    bookingEnabled={d.bookingEnabled}
                    hideAction
                    workplace={[d.clinic?.name, d.clinic?.city].filter(Boolean).join(' · ')}
                    onPress={() => nav.navigate('HealthDoctorProfile', { id: d.id })}
                    onBook={() => nav.navigate('HealthBooking', { doctorId: d.id })}
                  />
                ))}
              </View>
            ) : null}
          </ScrollView>

          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32, backgroundColor: 'rgba(237,237,237,0.96)', borderTopWidth: 1, borderTopColor: tokens.hairline }}>
            <RedButton trailing={false} onPress={() => c.phone && void Linking.openURL(`tel:${c.phone}`)}>
              {t('healthCard.common.call')}{c.phone ? ` · ${c.phone}` : ''}
            </RedButton>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
