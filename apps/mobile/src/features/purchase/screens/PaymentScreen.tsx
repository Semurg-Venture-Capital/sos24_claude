import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { useCards, type CardApi } from '../../../api/cards';
import { usePayPolicy } from '../../../api/payments';
import { usePolicy } from '../../../api/policies';
import { useWallet } from '../../../api/wallet';
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
import { usePurchaseStore } from '../store';
import { tokens } from '../../../theme/colors';
import type { PurchaseStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<PurchaseStackParamList, 'Payment'>;

const BRAND_MAP: Record<CardApi['brand'], CardBrand> = {
  UZCARD: 'uzcard',
  HUMO: 'humo',
  VISA: 'uzcard', // CardOption поддерживает только uzcard/humo — VISA/MC временно мапим
  MASTERCARD: 'humo',
};

// M7.1 — Оплата.
export function PaymentScreen() {
  const nav = useNavigation<Nav>();
  const state = usePurchaseStore();
  const policyId = state.draftPolicyId;

  const { data: policy } = usePolicy(policyId ?? undefined);
  const { data: wallet } = useWallet();
  const { data: cards } = useCards();
  const payMutation = usePayPolicy();

  const total = policy?.totalPrice ?? 0;
  const balance = wallet?.balance ?? 0;
  const productLabel = state.productType ? PRODUCTS[state.productType].name : '—';
  const car = policy?.vehicle;
  const isVehicleProduct = state.productType === 'osago' || state.productType === 'kasko';

  // selectedMethod = 'wallet' | <card.id>
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  useEffect(() => {
    if (selectedMethod || !cards || !wallet) return;
    setSelectedMethod(balance >= total ? 'wallet' : cards.find((c) => c.isDefault)?.id ?? cards[0]?.id ?? null);
  }, [cards, wallet, balance, total, selectedMethod]);

  const onPay = async () => {
    if (!policyId || !selectedMethod) return;
    try {
      await payMutation.mutateAsync(
        selectedMethod === 'wallet'
          ? { policyId, method: 'WALLET' }
          : { policyId, method: 'CARD', cardId: selectedMethod },
      );
      nav.navigate('Success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Оплата не прошла';
      Alert.alert('Платёж отклонён', msg);
    }
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
              {total.toLocaleString('ru-RU')}
            </Text>
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 16, color: tokens.inkMuted }}>
              сум
            </Text>
          </View>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted }}>
            {isVehicleProduct
              ? `${productLabel} · ${car ? `${car.brand} ${car.model}` : '—'} · ${state.periodMonths} мес`
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
              balance={balance}
              amount={total}
              selected={selectedMethod === 'wallet'}
              onPress={() => setSelectedMethod('wallet')}
            />
            {cards?.map((c) => (
              <CardOption
                key={c.id}
                brand={BRAND_MAP[c.brand]}
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
          <RedButton trailing={false} onPress={onPay} disabled={payMutation.isPending || !selectedMethod || !policyId}>
            {payMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <PayLockIcon color="#fff" />{'  '}Оплатить {total.toLocaleString('ru-RU')} сум
              </>
            )}
          </RedButton>
        </View>
      </View>
    </PhoneFrame>
  );
}
