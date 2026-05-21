import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { BackButton } from '../../../components/ui/BackButton';
import { Checkbox } from '../../../components/ui/Checkbox';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { SummaryBlock } from '../../../components/ui/SummaryBlock';
import { Tag } from '../../../components/ui/Tag';
import { PRODUCTS } from '../productData';
import { MOCK_CARS, MOCK_DRIVERS, calculatePrice, usePurchaseStore } from '../store';
import { tokens } from '../../../theme/colors';
import type { PurchaseStackParamList } from '../../../navigation/types';

// Mock-промокоды. SOS10 даёт 10%, дальше — бэк.
const PROMOS: Record<string, number> = { SOS10: 0.1 };

type Nav = NativeStackNavigationProp<PurchaseStackParamList, 'Checkout'>;

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
function pretty(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// M6.1 — Чекаут: финальная проверка перед оплатой.
export function CheckoutScreen() {
  const nav = useNavigation<Nav>();
  const state = usePurchaseStore();
  const calc = calculatePrice(state);
  const [accepted, setAccepted] = useState(true);

  const car = MOCK_CARS.find((c) => c.id === state.carId);
  const drivers = MOCK_DRIVERS.filter((d) => state.driverIds.includes(d.id));
  const productLabel = state.productType ? PRODUCTS[state.productType].name : '—';
  const isVehicleProduct = state.productType === 'osago' || state.productType === 'kasko';

  // Промокод
  const [promo, setPromo] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const discountRate = appliedPromo ? PROMOS[appliedPromo] : 0;
  const discount = Math.round(calc.total * discountRate);
  const finalTotal = calc.total - discount;

  const applyPromo = () => {
    const code = promo.trim().toUpperCase();
    if (!code) return;
    if (PROMOS[code]) {
      setAppliedPromo(code);
      setPromoError(null);
    } else {
      setPromoError('Промокод не найден');
    }
  };
  const removePromo = () => {
    setAppliedPromo(null);
    setPromo('');
    setPromoError(null);
  };

  return (
    <PhoneFrame>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 16,
        }}
      >
        <BackButton onPress={() => nav.goBack()} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeading title="Оформление полиса" subtitle="Проверьте данные перед оплатой" />

        {isVehicleProduct && car && (
          <SummaryBlock
            eyebrow="Автомобиль"
            editable
            onEdit={() => nav.navigate('CalcVehicle')}
            rows={[
              { label: 'Марка / модель', value: car.name },
              { label: 'Гос. номер', value: car.plate },
              { label: 'Год · Двигатель', value: `${car.year} · ${car.engine}` },
            ]}
          />
        )}

        {isVehicleProduct && (
          <SummaryBlock
            eyebrow="Водители"
            editable
            onEdit={() => nav.navigate('CalcDrivers')}
            rows={
              state.driverLimit === 'unlimited'
                ? [{ label: 'Без ограничений', value: '' }]
                : drivers.map((d) => ({ label: d.name, value: `стаж ${d.experience}` }))
            }
          />
        )}

        {isVehicleProduct && (
          <SummaryBlock
            eyebrow="Период"
            editable
            onEdit={() => nav.navigate('CalcPeriod')}
            rows={[
              { label: 'Срок', value: `${state.periodMonths} месяцев` },
              { label: 'Начало', value: pretty(state.startDate) },
              { label: 'Окончание', value: pretty(state.endDate) },
            ]}
          />
        )}

        {/* Промокод */}
        <View style={{ gap: 8, marginTop: 4 }}>
          <Text
            style={{
              fontFamily: 'Manrope_500Medium',
              fontSize: 11,
              color: tokens.inkMuted,
              letterSpacing: 0.88,
              textTransform: 'uppercase',
              paddingLeft: 4,
            }}
          >
            Промокод
          </Text>
          {appliedPromo ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 14,
                paddingHorizontal: 18,
                borderRadius: 18,
                backgroundColor: 'rgba(105,228,183,0.18)',
                borderWidth: 1,
                borderColor: 'rgba(105,228,183,0.5)',
              }}
            >
              <View style={{ gap: 2 }}>
                <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: tokens.ink }}>
                  {appliedPromo} · −{Math.round(discountRate * 100)}%
                </Text>
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>
                  Скидка {discount.toLocaleString('ru-RU')} сум применена
                </Text>
              </View>
              <Pressable onPress={removePromo} hitSlop={10}>
                <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.inkMuted }}>
                  Убрать
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 6 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingLeft: 16,
                  paddingRight: 6,
                  paddingVertical: 6,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255,255,255,0.6)',
                  borderWidth: 1,
                  borderColor: promoError ? tokens.red : tokens.hairline,
                }}
              >
                <TextInput
                  value={promo}
                  onChangeText={(t) => {
                    setPromo(t);
                    if (promoError) setPromoError(null);
                  }}
                  placeholder="Введите промокод"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={{
                    flex: 1,
                    fontFamily: 'Manrope_500Medium',
                    fontSize: 15,
                    color: tokens.ink,
                    paddingVertical: 10,
                  }}
                  onSubmitEditing={applyPromo}
                />
                <Pressable
                  onPress={applyPromo}
                  disabled={!promo.trim()}
                  style={({ pressed }) => ({
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 14,
                    backgroundColor: promo.trim() ? tokens.ink : 'rgba(20,20,20,0.15)',
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: '#fff' }}>
                    Применить
                  </Text>
                </Pressable>
              </View>
              {promoError && (
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.red, paddingLeft: 4 }}>
                  {promoError}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Total dark card */}
        <View
          style={{
            backgroundColor: tokens.inkDark,
            borderRadius: 32,
            padding: 22,
            paddingTop: 20,
            gap: 14,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.32,
            shadowRadius: 20,
            elevation: 6,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: 'Manrope_500Medium',
                fontSize: 11,
                color: tokens.inkMutedDark,
                letterSpacing: 0.88,
                textTransform: 'uppercase',
              }}
            >
              Стоимость
            </Text>
            <Tag tone="green">
              {productLabel} · {state.periodMonths} мес
            </Tag>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text
              style={{
                fontFamily: 'NeueMontreal-Medium',
                fontSize: 38,
                letterSpacing: -0.76,
                color: '#fff',
                lineHeight: 40,
              }}
            >
              {finalTotal.toLocaleString('ru-RU')}
            </Text>
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMutedDark }}>
              сум
            </Text>
          </View>
          {appliedPromo && (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMutedDark }}>
                Без скидки
              </Text>
              <Text
                style={{
                  fontFamily: 'Manrope_500Medium',
                  fontSize: 13,
                  color: tokens.inkMutedDark,
                  textDecorationLine: 'line-through',
                }}
              >
                {calc.total.toLocaleString('ru-RU')} сум
              </Text>
            </View>
          )}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMutedDark }}>
              Способ оплаты
            </Text>
            <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: '#fff' }}>
              {state.paymentPlan === 'oneTime' ? 'Единовременно' : 'Рассрочка'}
            </Text>
          </View>
        </View>

        {/* Agreement */}
        <View
          style={{
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          <BlurView
            intensity={20}
            tint="light"
            style={{
              backgroundColor: 'rgba(255,255,255,0.5)',
              padding: 16,
              paddingHorizontal: 18,
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <Checkbox checked={accepted} onChange={setAccepted} />
            <Text
              style={{
                flex: 1,
                fontFamily: 'Manrope_400Regular',
                fontSize: 13,
                color: tokens.ink,
                lineHeight: 19,
                letterSpacing: -0.065,
              }}
            >
              Я ознакомился с{' '}
              <Text style={{ color: tokens.inkDark, textDecorationLine: 'underline' }}>условиями оферты</Text>
              {' '}и согласен на обработку персональных данных
            </Text>
          </BlurView>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <LinearGradient colors={['rgba(228,228,228,0)', 'rgba(228,228,228,0.95)']} style={{ height: 24 }} />
        <View style={{ paddingHorizontal: 24, paddingBottom: 32, paddingTop: 8, backgroundColor: 'rgba(228,228,228,0.95)' }}>
          <RedButton
            disabled={!accepted}
            onPress={() => nav.navigate('Payment')}
          >
            Перейти к оплате · {finalTotal.toLocaleString('ru-RU')} сум
          </RedButton>
        </View>
      </View>
    </PhoneFrame>
  );
}
