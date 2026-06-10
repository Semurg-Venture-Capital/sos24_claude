import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, Text, View } from 'react-native';
import { OutlineButton } from '../../../components/ui/OutlineButton';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { SuccessTick } from '../../../components/ui/SuccessTick';
import { tokens } from '../../../theme/colors';
import { useEuroStore } from '../store';
import type { EuroStackParamList, MainStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<EuroStackParamList, 'EuroSuccess'>;

// Экран успеха европротокола — № извещения + дальнейшие шаги.
export function EuroSuccessScreen() {
  const nav = useNavigation<Nav>();
  const number = useEuroStore((s) => s.submittedNumber);
  const reset = useEuroStore((s) => s.reset);

  const goHome = () => {
    reset();
    // Закрыть весь стек европротокола (он лежит на MainStack поверх табов).
    nav.getParent<NativeStackNavigationProp<MainStackParamList>>()?.goBack();
  };

  return (
    <PhoneFrame>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 22 }}>
        <SuccessTick />

        <View style={{ alignItems: 'center', gap: 10 }}>
          <Text
            style={{
              fontFamily: 'NeueMontreal-Medium',
              fontSize: 26,
              letterSpacing: -0.26,
              color: tokens.ink,
              textAlign: 'center',
            }}
          >
            Извещение отправлено
          </Text>
          <Text
            style={{
              fontFamily: 'Manrope_400Regular',
              fontSize: 15,
              color: tokens.inkMuted,
              textAlign: 'center',
              lineHeight: 21,
              maxWidth: 300,
            }}
          >
            Европротокол оформлен. Следите за статусом выплаты в разделе «Заявления».
          </Text>
        </View>

        {/* Номер извещения */}
        <View
          style={{
            paddingVertical: 14,
            paddingHorizontal: 22,
            borderRadius: 18,
            backgroundColor: 'rgba(20,20,20,0.04)',
            borderWidth: 1,
            borderColor: tokens.hairline,
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Text
            style={{
              fontFamily: 'Manrope_500Medium',
              fontSize: 11,
              letterSpacing: 0.88,
              textTransform: 'uppercase',
              color: tokens.inkMuted,
            }}
          >
            № извещения
          </Text>
          <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 20, letterSpacing: 0.5, color: tokens.ink }}>
            {number ?? '—'}
          </Text>
        </View>

        {/* Напоминание про 4 часа (специфика УЗ) */}
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            padding: 14,
            borderRadius: 16,
            backgroundColor: 'rgba(245,200,80,0.16)',
            maxWidth: 320,
          }}
        >
          <Text style={{ fontSize: 16 }}>⏱️</Text>
          <Text style={{ flex: 1, fontFamily: 'Manrope_500Medium', fontSize: 12, lineHeight: 17, color: '#503a07' }}>
            В течение 4 часов оба водителя должны пройти медосвидетельствование в наркодиспансере.
          </Text>
        </View>
      </View>

      {/* Действия */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 32, gap: 10 }}>
        <RedButton onPress={goHome}>На главную</RedButton>
        <OutlineButton onPress={() => Alert.alert('Скоро', 'Раздел «Заявления» (M10) — в разработке.')}>
          Мои заявления
        </OutlineButton>
      </View>
    </PhoneFrame>
  );
}
