import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../../theme/colors';
import type { HealthStackParamList } from '../../../navigation/types';
import { Avatar } from '../../../components/ui/Avatar';
import { RedButton } from '../../../components/ui/RedButton';
import { CalendarIcon } from '../../../components/icons/CalendarIcon';
import { medGlass } from '../components';

type Nav = NativeStackNavigationProp<HealthStackParamList, 'HealthBookingDone'>;
type Rt = RouteProp<HealthStackParamList, 'HealthBookingDone'>;

function formatDate(iso: string, t: TFunction) {
  const d = new Date(iso);
  const day = `${t('health.date.weekdayAbbr.' + d.getDay())}, ${d.getDate()} ${t('health.date.monthLong.' + d.getMonth())}`;
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return { day, time };
}

export function HealthBookingDoneScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { doctorName, specialty, clinicName, scheduledAt } = params;
  const { day, time } = formatDate(scheduledAt, t);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.pageBg }} edges={['top']}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 40 }}>
        {/* Успех */}
        <View style={{ alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 999,
              backgroundColor: 'rgba(105,228,183,0.5)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 4,
            }}
          >
            <Text style={{ fontSize: 38, color: '#0a3a26', lineHeight: 42 }}>✓</Text>
          </View>
          <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 24, letterSpacing: -0.24, color: tokens.ink }}>
            {t('health.bookingDone.title')}
          </Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted }}>
            {t('health.bookingDone.subtitle')}
          </Text>
        </View>

        {/* Карточка записи */}
        <View style={[{ marginTop: 32, padding: 20, borderRadius: 26, gap: 14 }, medGlass]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar name={doctorName} size={48} />
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 15, color: tokens.ink }}>{doctorName}</Text>
              <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12.5, color: tokens.inkMuted }}>
                {specialty}
                {clinicName ? ` · ${clinicName}` : ''}
              </Text>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: tokens.hairline }} />
          <View style={{ flexDirection: 'row', gap: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CalendarIcon size={16} color={tokens.red} />
              <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13.5, color: tokens.ink }}>{day}</Text>
            </View>
            <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13.5, color: tokens.ink }}>🕐 {time}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, padding: 14, borderRadius: 16, backgroundColor: 'rgba(20,20,20,0.04)' }}>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted, lineHeight: 17, flex: 1 }}>
            {t('health.bookingDone.note')}
          </Text>
        </View>
      </View>

      {/* CTA */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 32, gap: 12 }}>
        <RedButton trailing={false} onPress={() => nav.navigate('HealthHub')}>
          {t('health.bookingDone.done')}
        </RedButton>
        <Pressable onPress={() => nav.navigate('HealthHub')} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignItems: 'center', paddingVertical: 8 })}>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: tokens.inkMuted }}>{t('health.bookingDone.backToHealth')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
