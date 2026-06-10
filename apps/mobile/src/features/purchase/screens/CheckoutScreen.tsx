import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Glass } from '../../../components/ui/Glass';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useCreatePolicy } from '../../../api/policies';
import { useValidatePromo } from '../../../api/promo';
import { useDrivers, type Driver } from '../../../api/drivers';
import { useVehicles } from '../../../api/vehicles';
import { BackButton } from '../../../components/ui/BackButton';
import { Checkbox } from '../../../components/ui/Checkbox';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { SummaryBlock } from '../../../components/ui/SummaryBlock';
import { Tag } from '../../../components/ui/Tag';
import { PRODUCTS } from '../productData';
import { calculatePrice, usePurchaseStore } from '../store';
import { tokens } from '../../../theme/colors';
import type { ProductType } from '../../../navigation/types';
import type { PurchaseStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<PurchaseStackParamList, 'Checkout'>;

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
function pretty(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const TYPE_TO_API: Record<ProductType, 'OSAGO' | 'KASKO' | 'HEALTH' | 'HOME' | 'FINANCE'> = {
  osago: 'OSAGO',
  kasko: 'KASKO',
  health: 'HEALTH',
  home: 'HOME',
  finance: 'FINANCE',
};

function formatExperience(d: Driver): string {
  const y = d.experienceYears;
  if (y === 1) return `стаж 1 год`;
  if (y >= 2 && y <= 4) return `стаж ${y} года`;
  return `стаж ${y} лет`;
}

// M6.1 — Чекаут: финальная проверка перед оплатой.
export function CheckoutScreen() {
  const nav = useNavigation<Nav>();
  const state = usePurchaseStore();
  const setPromoCode = usePurchaseStore((s) => s.setPromoCode);
  const setDraftPolicyId = usePurchaseStore((s) => s.setDraftPolicyId);
  const calc = calculatePrice(state); // локальный preview, окончательный расчёт на бэке

  const { data: vehicles } = useVehicles();
  const { data: drivers } = useDrivers();
  const validatePromo = useValidatePromo();
  const createPolicy = useCreatePolicy();

  const [accepted, setAccepted] = useState(true);
  const car = vehicles?.find((c) => c.id === state.carId);
  const selectedDrivers = drivers?.filter((d) => state.driverIds.includes(d.id)) ?? [];
  const productLabel = state.productType ? PRODUCTS[state.productType].name : '—';
  const isVehicleProduct = state.productType === 'osago' || state.productType === 'kasko';

  // Промокод
  const [promo, setPromo] = useState(state.promoCode ?? '');
  const [appliedDiscountPct, setAppliedDiscountPct] = useState<number>(0);
  const [promoError, setPromoError] = useState<string | null>(null);
  const appliedPromo = state.promoCode;
  const discount = Math.round((calc.total * appliedDiscountPct) / 100);
  const finalTotal = calc.total - discount;

  const applyPromo = async () => {
    const code = promo.trim().toUpperCase();
    if (!code) return;
    try {
      const result = await validatePromo.mutateAsync(code);
      setAppliedDiscountPct(result.discountPct);
      setPromoCode(result.code);
      setPromoError(null);
    } catch {
      setPromoError('Промокод не найден');
    }
  };
  const removePromo = () => {
    setAppliedDiscountPct(0);
    setPromoCode(null);
    setPromo('');
    setPromoError(null);
  };

  const goToPayment = async () => {
    if (!state.productType) return;
    try {
      const policy = await createPolicy.mutateAsync({
        type: TYPE_TO_API[state.productType],
        vehicleId: isVehicleProduct ? state.carId ?? undefined : undefined,
        periodMonths: isVehicleProduct ? state.periodMonths : 12,
        driverLimit: state.driverLimit === 'limited' ? 'LIMITED' : 'UNLIMITED',
        driverIds: isVehicleProduct ? state.driverIds : undefined,
        startDate: state.startDate,
        promoCode: appliedPromo ?? undefined,
      });
      setDraftPolicyId(policy.id);
      nav.navigate('Payment');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Не удалось создать полис';
      Alert.alert('Ошибка', msg);
    }
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
              { label: 'Марка / модель', value: `${car.brand} ${car.model}` },
              { label: 'Гос. номер', value: car.plate },
              { label: 'Год · Двигатель', value: `${car.year} · ${car.engine ?? '—'}` },
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
                : selectedDrivers.map((d) => ({ label: d.name, value: formatExperience(d) }))
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
                  {appliedPromo} · −{appliedDiscountPct}%
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
                  disabled={!promo.trim() || validatePromo.isPending}
                  style={({ pressed }) => ({
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 14,
                    backgroundColor: promo.trim() ? tokens.ink : 'rgba(20,20,20,0.15)',
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  {validatePromo.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: '#fff' }}>
                      Применить
                    </Text>
                  )}
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
          <Glass
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
          </Glass>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <LinearGradient colors={['rgba(228,228,228,0)', 'rgba(228,228,228,0.95)']} style={{ height: 24 }} />
        <View style={{ paddingHorizontal: 24, paddingBottom: 32, paddingTop: 8, backgroundColor: 'rgba(228,228,228,0.95)' }}>
          <RedButton
            disabled={!accepted || createPolicy.isPending}
            onPress={goToPayment}
          >
            {createPolicy.isPending
              ? 'Создаём…'
              : `Перейти к оплате · ${finalTotal.toLocaleString('ru-RU')} сум`}
          </RedButton>
        </View>
      </View>
    </PhoneFrame>
  );
}
