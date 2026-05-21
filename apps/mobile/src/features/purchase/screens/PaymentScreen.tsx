import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { PayLockIcon } from '../../../components/icons/PayLockIcon';
import { BackButton } from '../../../components/ui/BackButton';
import { CardOption, type CardBrand } from '../../../components/ui/CardOption';
import { NewCardOption } from '../../../components/ui/NewCardOption';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { SecureNote } from '../../../components/ui/SecureNote';
import { TextLink } from '../../../components/ui/TextLink';
import { WalletPayOption } from '../../../components/ui/WalletPayOption';
import { PRODUCTS } from '../productData';
import { MOCK_CARS, calculatePrice, usePurchaseStore } from '../store';
import { tokens } from '../../../theme/colors';
import type { PurchaseStackParamList } from '../../../navigation/types';

// Мок-баланс кошелька SOS24. Бэк ещё не реализован — потом тянем из /me/wallet.
const MOCK_WALLET_BALANCE = 500000;

type Nav = NativeStackNavigationProp<PurchaseStackParamList, 'Payment'>;

interface MockCard {
  id: string;
  brand: CardBrand;
  last4: string;
  expiry: string;
}

const MOCK_CARDS: MockCard[] = [
  { id: 'card1', brand: 'uzcard', last4: '4582', expiry: '08/27' },
  { id: 'card2', brand: 'humo', last4: '1190', expiry: '03/28' },
];

// M7.1 — Оплата.
export function PaymentScreen() {
  const nav = useNavigation<Nav>();
  const state = usePurchaseStore();
  const calc = calculatePrice(state);
  // selectedMethod = 'wallet' | <card.id>. Default — кошелёк, если хватает баланса, иначе первая карта.
  const defaultMethod = MOCK_WALLET_BALANCE >= calc.total ? 'wallet' : MOCK_CARDS[0].id;
  const [selectedMethod, setSelectedMethod] = useState<string>(defaultMethod);
  const [submitting, setSubmitting] = useState(false);

  const productLabel = state.productType ? PRODUCTS[state.productType].name : '—';
  const car = MOCK_CARS.find((c) => c.id === state.carId);
  // Для не-авто продуктов (health/home/finance) скрываем строку с авто.
  const isVehicleProduct = state.productType === 'osago' || state.productType === 'kasko';

  const onPay = async () => {
    setSubmitting(true);
    // Имитация платёжного запроса. В реале — POST /payments/uzcard.
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitting(false);
    nav.navigate('Success');
  };

  return (
    <PhoneFrame>
      <View style={{ flexDirection: 'row', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 }}>
        <BackButton onPress={() => nav.goBack()} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount block */}
        <View style={{ alignItems: 'center', gap: 6, paddingHorizontal: 24, paddingBottom: 28 }}>
          <Text
            style={{
              fontFamily: 'Manrope_600SemiBold',
              fontSize: 11,
              color: tokens.inkMuted,
              letterSpacing: 0.88,
              textTransform: 'uppercase',
            }}
          >
            К оплате
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text
              style={{
                fontFamily: 'NeueMontreal-Medium',
                fontSize: 44,
                letterSpacing: -0.88,
                color: tokens.ink,
                lineHeight: 46,
              }}
            >
              {calc.total.toLocaleString('ru-RU')}
            </Text>
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 16, color: tokens.inkMuted }}>
              сум
            </Text>
          </View>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted }}>
            {isVehicleProduct
              ? `${productLabel} · ${car?.name ?? '—'} · ${state.periodMonths} мес`
              : productLabel}
          </Text>
        </View>

        {/* Method */}
        <View style={{ paddingHorizontal: 24, gap: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
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
            <TextLink onPress={() => nav.navigate('MyCards')}>Все карты</TextLink>
          </View>

          <View style={{ gap: 10 }}>
            <WalletPayOption
              balance={MOCK_WALLET_BALANCE}
              amount={calc.total}
              selected={selectedMethod === 'wallet'}
              onPress={() => setSelectedMethod('wallet')}
            />
            {MOCK_CARDS.map((c) => (
              <CardOption
                key={c.id}
                brand={c.brand}
                last4={c.last4}
                expiry={c.expiry}
                selected={c.id === selectedMethod}
                onPress={() => setSelectedMethod(c.id)}
              />
            ))}
            <NewCardOption />
          </View>

          <SecureNote text="Платёж защищён. Данные карты не сохраняются на нашем сервере." />
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <LinearGradient colors={['rgba(228,228,228,0)', 'rgba(228,228,228,0.95)']} style={{ height: 24 }} />
        <View style={{ paddingHorizontal: 24, paddingBottom: 32, paddingTop: 8, backgroundColor: 'rgba(228,228,228,0.95)' }}>
          <RedButton trailing={false} onPress={onPay} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <PayLockIcon color="#fff" />{'  '}Оплатить {calc.total.toLocaleString('ru-RU')} сум
              </>
            )}
          </RedButton>
        </View>
      </View>
    </PhoneFrame>
  );
}
