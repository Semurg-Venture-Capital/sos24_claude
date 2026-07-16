import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import {
  useCancelBooking,
  useCreateReview,
  useMyBookings,
  type Booking,
  type BookingStatus,
} from '../../../api/partners';
import { BackButton } from '../../../components/ui/BackButton';
import { Glass } from '../../../components/ui/Glass';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { StarIcon } from '../../../components/icons/StarIcon';
import { tokens } from '../../../theme/colors';
import type { PartnersStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<PartnersStackParamList, 'MyBookings'>;

const STATUS_TONE: Record<BookingStatus, { bg: string; fg: string }> = {
  PENDING: { bg: 'rgba(245,200,80,0.2)', fg: '#8a6300' },
  CONFIRMED: { bg: 'rgba(86,140,255,0.14)', fg: '#3670d4' },
  CANCELLED: { bg: 'rgba(20,20,20,0.06)', fg: tokens.inkMuted },
  COMPLETED: { bg: 'rgba(105,228,183,0.22)', fg: '#0a3a26' },
};

export function MyBookingsScreen() {
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();
  const { data: bookings = [], isLoading } = useMyBookings();
  const cancel = useCancelBooking();
  const [reviewFor, setReviewFor] = useState<Booking | null>(null);

  return (
    <PhoneFrame>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 }}>
        <BackButton onPress={() => nav.goBack()} />
        <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 24, letterSpacing: -0.24, color: tokens.ink }}>{t('partners.myBookings')}</Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.red} />
        </View>
      ) : bookings.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 8 }}>
          <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 20, color: tokens.ink, textAlign: 'center' }}>{t('partners.bookings.emptyTitle')}</Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted, textAlign: 'center' }}>{t('partners.bookings.emptySubtitle')}</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60, gap: 10 }} showsVerticalScrollIndicator={false}>
          {bookings.map((b) => {
            const tone = STATUS_TONE[b.status];
            const when = new Date(b.scheduledAt).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
            const canCancel = b.status === 'PENDING' || b.status === 'CONFIRMED';
            const canReview = b.status === 'COMPLETED' && !b.hasReview;
            return (
              <Glass key={b.id} intensity={20} tint="light" style={{ backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 22, borderWidth: 1, borderColor: tokens.hairline, padding: 16, gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <Text style={{ flex: 1, fontFamily: 'NeueMontreal-Medium', fontSize: 16, color: tokens.ink }} numberOfLines={1}>{b.partnerName}</Text>
                  <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: tone.bg }}>
                    <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 10, color: tone.fg }}>{t('partners.map.' + b.status)}</Text>
                  </View>
                </View>
                <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.inkDark }}>{when}</Text>
                {b.services.length > 0 && (
                  <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>{b.services.map((s) => s.name).join(', ')}</Text>
                )}
                {(canCancel || canReview) && (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    {canReview && (
                      <Pressable onPress={() => setReviewFor(b)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: tokens.inkDark }}>
                        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: '#fff' }}>{t('partners.bookings.leaveReview')}</Text>
                      </Pressable>
                    )}
                    {canCancel && (
                      <Pressable onPress={() => cancel.mutate(b.id)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: tokens.hairline }}>
                        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: tokens.red }}>{t('partners.bookings.cancel')}</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </Glass>
            );
          })}
        </ScrollView>
      )}

      <ReviewModal booking={reviewFor} onClose={() => setReviewFor(null)} />
    </PhoneFrame>
  );
}

function ReviewModal({ booking, onClose }: { booking: Booking | null; onClose: () => void }) {
  const { t } = useTranslation();
  const createReview = useCreateReview();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');

  const submit = async () => {
    if (!booking) return;
    try {
      await createReview.mutateAsync({ partnerId: booking.partnerId, bookingId: booking.id, rating, text: text.trim() || undefined });
      setText('');
      setRating(5);
      onClose();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg || t('partners.review.error'));
    }
  };

  return (
    <Modal visible={!!booking} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable style={{ backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36, gap: 16 }} onPress={(e) => e.stopPropagation()}>
          <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 20, color: tokens.ink }}>{t('partners.review.title', { name: booking?.partnerName })}</Text>
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setRating(n)}>
                <StarIcon size={34} color={n <= rating ? '#f5c850' : 'rgba(20,20,20,0.15)'} />
              </Pressable>
            ))}
          </View>
          <View style={{ backgroundColor: tokens.glass, borderRadius: 16, borderWidth: 1, borderColor: tokens.hairline, padding: 14, minHeight: 90 }}>
            <TextInput value={text} onChangeText={setText} placeholder={t('partners.review.placeholder')} placeholderTextColor={tokens.inkMuted} multiline style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.ink }} />
          </View>
          <RedButton onPress={submit} disabled={createReview.isPending}>
            {createReview.isPending ? t('partners.review.submitting') : t('partners.review.submit')}
          </RedButton>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
