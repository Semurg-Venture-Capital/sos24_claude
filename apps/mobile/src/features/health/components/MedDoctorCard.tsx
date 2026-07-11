import { Pressable, Text, View } from 'react-native';
import { Avatar } from '../../../components/ui/Avatar';
import { StarIcon } from '../../../components/icons/StarIcon';
import { BadgeCheckIcon, MapPinIcon, PhoneFillIcon, VideoIcon } from '../../../components/icons/MedIcons';
import { ChevronRight } from '../../../components/icons/ChevronRight';
import { tokens } from '../../../theme/colors';
import { medGlass } from './medGlass';

export interface MedDoctorCardProps {
  name: string;
  specialty: string;
  experience?: string; // «12 лет»
  rating: string; // «4.9»
  reviews: string; // «214 отзывов»
  price: string; // «180 000 сум»
  distance?: string; // «1.2 км»
  video?: boolean;
  verified?: boolean;
  // Режим: запись (по умолчанию) или звонок (врач-контакт).
  bookingEnabled?: boolean;
  workplace?: string; // «Клиника · Город» — для врача-контакта
  onPress?: () => void;
  onBook?: () => void;
  onCall?: () => void;
}

// Карточка врача (M14.4/14.1): аватар с бейджем-check, специальность/стаж,
// рейтинг+отзывы, дистанция, «видео-приём», цена приёма и кнопка «Записаться».
export function MedDoctorCard({
  name,
  specialty,
  experience,
  rating,
  reviews,
  price,
  distance,
  video,
  verified = true,
  bookingEnabled = true,
  workplace,
  onPress,
  onBook,
  onCall,
}: MedDoctorCardProps) {
  const hasPrice = !!price && price !== '—';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ borderRadius: 24, padding: 16, gap: 14, opacity: pressed ? 0.9 : 1 }, medGlass]}
    >
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <View>
          <Avatar name={name} size={58} />
          {verified ? (
            <View
              style={{
                position: 'absolute',
                right: -2,
                bottom: -2,
                width: 20,
                height: 20,
                borderRadius: 999,
                backgroundColor: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 3,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              <BadgeCheckIcon size={14} color={tokens.blue} />
            </View>
          ) : null}
        </View>

        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 16, color: tokens.ink }}>{name}</Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted }}>
            {specialty}
            {experience ? ` · стаж ${experience}` : ''}
          </Text>
          {bookingEnabled ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <StarIcon size={13} />
                <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.ink }}>{rating}</Text>
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted }}>· {reviews}</Text>
              </View>
              {distance ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MapPinIcon size={13} />
                  <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted }}>{distance}</Text>
                </View>
              ) : null}
            </View>
          ) : workplace ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <MapPinIcon size={13} />
              <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted }} numberOfLines={1}>
                {workplace}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {(bookingEnabled && video) || hasPrice ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {bookingEnabled && video ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 999,
                backgroundColor: 'rgba(86,140,255,0.14)',
              }}
            >
              <VideoIcon size={13} color="#1a3577" />
              <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: '#1a3577' }}>Видео-приём</Text>
            </View>
          ) : null}
          <View style={{ flex: 1 }} />
          {hasPrice ? (
            <>
              <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted }}>приём</Text>
              <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 15, color: tokens.ink }}>{price}</Text>
            </>
          ) : null}
        </View>
      ) : null}

      {bookingEnabled ? (
        <Pressable
          onPress={onBook ?? onPress}
          style={({ pressed }) => ({ height: 46, borderRadius: 999, backgroundColor: tokens.inkDark, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed ? 0.85 : 1 })}
        >
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: '#fff' }}>Записаться</Text>
          <ChevronRight size={12} color="rgba(255,255,255,0.6)" />
        </Pressable>
      ) : (
        <Pressable
          onPress={onCall}
          style={({ pressed }) => ({ height: 46, borderRadius: 999, backgroundColor: tokens.red, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed ? 0.85 : 1 })}
        >
          <PhoneFillIcon size={15} color="#fff" />
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: '#fff' }}>Позвонить</Text>
        </Pressable>
      )}
    </Pressable>
  );
}
