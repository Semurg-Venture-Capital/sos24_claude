import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { STATUS_LABEL, useMyTickets, type SupportTicket, type TicketStatus } from '../../../api/support';
import { BackButton } from '../../../components/ui/BackButton';
import { FAB } from '../../../components/ui/FAB';
import { Glass } from '../../../components/ui/Glass';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { tokens } from '../../../theme/colors';
import type { SupportStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<SupportStackParamList, 'SupportTickets'>;

const STATUS_TONE: Record<TicketStatus, { bg: string; fg: string }> = {
  OPEN: { bg: 'rgba(86,140,255,0.14)', fg: '#3670d4' },
  PENDING: { bg: 'rgba(245,200,80,0.18)', fg: '#8a6300' },
  CLOSED: { bg: 'rgba(20,20,20,0.06)', fg: tokens.inkMuted },
};

function time(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function SupportTicketsScreen() {
  const nav = useNavigation<Nav>();
  const { data, isLoading, refetch } = useMyTickets();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const tickets = data?.tickets ?? [];
  const isEmpty = !isLoading && tickets.length === 0;

  return (
    <PhoneFrame>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 }}>
        <BackButton onPress={() => nav.goBack()} />
        <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 26, letterSpacing: -0.26, color: tokens.ink }}>
          Мои обращения
        </Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.red} />
        </View>
      ) : isEmpty ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 8 }}>
          <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 20, color: tokens.ink, textAlign: 'center' }}>
            Обращений пока нет
          </Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted, textAlign: 'center' }}>
            Задайте вопрос — оператор ответит в чате
          </Text>
          <View style={{ width: 260, marginTop: 12 }}>
            <RedButton onPress={() => nav.navigate('SupportNewTicket')}>Новое обращение</RedButton>
          </View>
        </View>
      ) : (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 160, gap: 10 }}
            showsVerticalScrollIndicator={false}
          >
            {tickets.map((t) => (
              <TicketCard key={t.id} item={t} onPress={() => nav.navigate('SupportChat', { ticketId: t.id, subject: t.subject })} />
            ))}
          </ScrollView>
          <FAB onPress={() => nav.navigate('SupportNewTicket')} bottom={32} />
        </>
      )}
    </PhoneFrame>
  );
}

function TicketCard({ item, onPress }: { item: SupportTicket; onPress: () => void }) {
  const tone = STATUS_TONE[item.status];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ borderRadius: 24, overflow: 'hidden', opacity: pressed ? 0.7 : 1 })}>
      <Glass intensity={20} tint="light" style={{ backgroundColor: 'rgba(255,255,255,0.55)', padding: 16, borderWidth: 1, borderColor: tokens.hairline, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <Text style={{ flex: 1, fontFamily: 'NeueMontreal-Medium', fontSize: 15, color: tokens.ink }} numberOfLines={1}>
            {item.subject}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {item.unreadForUser > 0 && (
              <View style={{ minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 999, backgroundColor: tokens.red, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 10, color: '#fff' }}>{item.unreadForUser}</Text>
              </View>
            )}
            <View style={{ paddingVertical: 4, paddingHorizontal: 9, borderRadius: 999, backgroundColor: tone.bg }}>
              <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 10, color: tone.fg }}>{STATUS_LABEL[item.status]}</Text>
            </View>
          </View>
        </View>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }} numberOfLines={1}>
          {item.categoryLabel} · {item.lastMessagePreview}
        </Text>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 11, color: tokens.inkSubtle }}>{time(item.lastMessageAt)}</Text>
      </Glass>
    </Pressable>
  );
}
