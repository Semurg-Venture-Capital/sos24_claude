import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, Image, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { usePartnerDetail, type PartnerReview, type PartnerService } from '../../../api/partners';
import { BackButton } from '../../../components/ui/BackButton';
import { Glass } from '../../../components/ui/Glass';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { StarIcon } from '../../../components/icons/StarIcon';
import { tokens } from '../../../theme/colors';
import type { PartnersStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<PartnersStackParamList, 'PartnerDetail'>;
type Rt = RouteProp<PartnersStackParamList, 'PartnerDetail'>;

const DAYS: { key: string; label: string }[] = [
  { key: 'mon', label: 'Пн' },
  { key: 'tue', label: 'Вт' },
  { key: 'wed', label: 'Ср' },
  { key: 'thu', label: 'Чт' },
  { key: 'fri', label: 'Пт' },
  { key: 'sat', label: 'Сб' },
  { key: 'sun', label: 'Вс' },
];

function fmtPrice(from: number | null, to: number | null): string {
  if (from == null && to == null) return 'по запросу';
  const f = (n: number) => n.toLocaleString('ru-RU');
  if (from != null && to != null) return `${f(from)}–${f(to)} сум`;
  return `от ${f((from ?? to)!)} сум`;
}

export function PartnerDetailScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { data: p, isLoading } = usePartnerDetail(params.id);

  if (isLoading || !p) {
    return (
      <PhoneFrame>
        <View style={{ flexDirection: 'row', paddingHorizontal: 24, paddingTop: 8 }}>
          <BackButton onPress={() => nav.goBack()} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.red} />
        </View>
      </PhoneFrame>
    );
  }

  const route = () => {
    if (p.lat == null || p.lng == null) return;
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${p.lat},${p.lng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <PhoneFrame bottomSafeArea={false} topSafeArea={false}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Баннер */}
        <View style={{ height: 240, backgroundColor: '#3a3a3a' }}>
          {p.coverUrl && <Image source={{ uri: p.coverUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />}
        </View>
        <View style={{ position: 'absolute', top: 56, left: 24, zIndex: 3 }}>
          <BackButton onPress={() => nav.goBack()} />
        </View>

        {/* Карточка заголовка */}
        <View style={{ marginTop: -32, marginHorizontal: 24, backgroundColor: '#fff', borderRadius: 28, padding: 20, gap: 14, borderWidth: 1, borderColor: tokens.hairline }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ gap: 6, flex: 1 }}>
              {p.category && (
                <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: tokens.inkDark }}>
                  <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: '#fff' }}>{p.category.name} · партнёр SOS24</Text>
                </View>
              )}
              <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 24, color: tokens.ink, letterSpacing: -0.24 }}>{p.name}</Text>
            </View>
            {p.openNow != null && (
              <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: p.openNow ? 'rgba(105,228,183,0.85)' : 'rgba(20,20,20,0.06)' }}>
                <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: p.openNow ? '#0a3a26' : tokens.inkMuted }}>{p.openNow ? 'открыто' : 'закрыто'}</Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <StarIcon size={13} />
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.inkDark }}>{p.rating.toFixed(1)}</Text>
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted }}>· {p.reviewCount} отзывов</Text>
          </View>

          {/* Адрес + маршрут */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, backgroundColor: 'rgba(20,20,20,0.04)' }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 10, color: tokens.inkMuted, letterSpacing: 0.4 }}>АДРЕС</Text>
              <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.inkDark }}>{p.address}</Text>
            </View>
            {p.lat != null && p.lng != null && (
              <Pressable onPress={route} style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: tokens.inkDark }}>
                <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: '#fff' }}>Маршрут</Text>
              </Pressable>
            )}
          </View>

          {/* Телефон */}
          {p.phone && (
            <Pressable onPress={() => Linking.openURL(`tel:${p.phone}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.red }}>{p.phone}</Text>
            </Pressable>
          )}
        </View>

        {/* Часы работы */}
        {p.workingHours && (
          <View style={{ marginTop: 20, marginHorizontal: 24, gap: 8 }}>
            <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 18, color: tokens.ink }}>Часы работы</Text>
            <Glass intensity={20} tint="light" style={{ backgroundColor: tokens.glass, borderRadius: 18, borderWidth: 1, borderColor: tokens.hairline, padding: 14, gap: 6 }}>
              {DAYS.map((d) => {
                const h = p.workingHours?.[d.key];
                return (
                  <View key={d.key} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.inkMuted }}>{d.label}</Text>
                    <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.ink }}>{h ? `${h.open}–${h.close}` : 'выходной'}</Text>
                  </View>
                );
              })}
            </Glass>
          </View>
        )}

        {/* Услуги */}
        {p.services.length > 0 && (
          <View style={{ marginTop: 20, marginHorizontal: 24, gap: 10 }}>
            <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 18, color: tokens.ink }}>Услуги</Text>
            {p.services.map((s) => (
              <ServiceRow key={s.id} s={s} />
            ))}
          </View>
        )}

        {/* Отзывы */}
        <View style={{ marginTop: 20, marginHorizontal: 24, gap: 10 }}>
          <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 18, color: tokens.ink }}>Отзывы</Text>
          {p.reviews.length === 0 ? (
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted }}>Пока нет отзывов</Text>
          ) : (
            p.reviews.map((r) => <ReviewRow key={r.id} r={r} />)
          )}
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32, backgroundColor: 'rgba(237,237,237,0.96)', borderTopWidth: 1, borderTopColor: tokens.hairline }}>
        <RedButton onPress={() => nav.navigate('PartnerBooking', { partnerId: p.id, partnerName: p.name })}>Записаться</RedButton>
      </View>
    </PhoneFrame>
  );
}

function ServiceRow({ s }: { s: PartnerService }) {
  return (
    <Glass intensity={20} tint="light" style={{ backgroundColor: tokens.glass, borderRadius: 18, borderWidth: 1, borderColor: tokens.hairline, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: tokens.ink }}>{s.name}</Text>
        {s.description && <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>{s.description}</Text>}
      </View>
      <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.inkDark }}>{fmtPrice(s.priceFrom, s.priceTo)}</Text>
    </Glass>
  );
}

function ReviewRow({ r }: { r: PartnerReview }) {
  return (
    <Glass intensity={20} tint="light" style={{ backgroundColor: tokens.glass, borderRadius: 18, borderWidth: 1, borderColor: tokens.hairline, padding: 14, gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.ink }}>{r.authorName}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <StarIcon size={11} />
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: tokens.inkDark }}>{r.rating}</Text>
        </View>
      </View>
      {r.text && <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted, lineHeight: 18 }}>{r.text}</Text>}
    </Glass>
  );
}
