import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { CoefRow } from '../../../components/ui/CoefRow';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { Segmented } from '../../../components/ui/Segmented';
import { Tag } from '../../../components/ui/Tag';
import { WizardFrame } from '../../../components/ui/WizardFrame';
import { tokens } from '../../../theme/colors';
import { calculatePrice, usePurchaseStore } from '../store';
import type { PurchaseStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<PurchaseStackParamList, 'CalcResult'>;

// M5.4 — Шаг 4: итоговая стоимость + выбор способа оплаты.
export function CalcResultScreen() {
  const nav = useNavigation<Nav>();
  const state = usePurchaseStore();
  const calc = calculatePrice(state);
  const paymentIdx = state.paymentPlan === 'oneTime' ? 0 : 1;

  const productLabel = state.productType === 'kasko' ? 'КАСКО' : 'ОСАГО';

  return (
    <WizardFrame
      step={4}
      eyebrow="Шаг 4 из 4 · Стоимость"
      primary="Оформить полис"
      primaryAction={() => nav.navigate('Checkout')}
      onBack={() => nav.goBack()}
    >
      <ScreenHeading title="Стоимость полиса" subtitle={`Расчёт ${productLabel} на ${state.periodMonths} мес`} />

      {/* Big total card — dark */}
      <View
        style={{
          padding: 22,
          paddingBottom: 26,
          borderRadius: 32,
          backgroundColor: tokens.inkDark,
          gap: 14,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 6,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: 'Manrope_500Medium',
              fontSize: 12,
              color: tokens.inkMutedDark,
              letterSpacing: 0.72,
              textTransform: 'uppercase',
            }}
          >
            Итого
          </Text>
          <Tag tone="green">
            {productLabel} · {state.periodMonths} мес
          </Tag>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Text
            style={{
              fontFamily: 'NeueMontreal-Medium',
              fontSize: 40,
              letterSpacing: -0.8,
              color: '#fff',
              lineHeight: 42,
            }}
          >
            {calc.total.toLocaleString('ru-RU')}
          </Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMutedDark }}>
            сум
          </Text>
        </View>
        <View style={{ gap: 0, marginTop: 4 }}>
          {calc.coefficients.map((c, i) => (
            <CoefRow key={i} label={c.label} value={c.value} onDark noBorder={i === 0} />
          ))}
        </View>
      </View>

      {/* Payment method */}
      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontFamily: 'Manrope_500Medium',
            fontSize: 13,
            color: tokens.inkMuted,
            letterSpacing: -0.065,
          }}
        >
          Способ оплаты
        </Text>
        <Segmented
          options={['Единовременно', 'Рассрочка']}
          active={paymentIdx}
          onChange={(i) => usePurchaseStore.getState().setPaymentPlan(i === 0 ? 'oneTime' : 'installment')}
        />
        {state.paymentPlan === 'installment' && (
          <Text
            style={{
              marginTop: 4,
              fontFamily: 'Manrope_400Regular',
              fontSize: 13,
              color: tokens.inkMuted,
              lineHeight: 18,
            }}
          >
            {Math.round(calc.total / 12).toLocaleString('ru-RU')} сум × 12 месяцев. Первый платёж — сегодня.
          </Text>
        )}
      </View>
    </WizardFrame>
  );
}
