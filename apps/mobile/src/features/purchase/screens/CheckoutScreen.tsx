import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { BackButton } from '../../../components/ui/BackButton';
import { Checkbox } from '../../../components/ui/Checkbox';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { SummaryBlock } from '../../../components/ui/SummaryBlock';
import { Tag } from '../../../components/ui/Tag';
import { MOCK_CARS, MOCK_DRIVERS, calculatePrice, usePurchaseStore } from '../store';
import { tokens } from '../../../theme/colors';
import type { PurchaseStackParamList } from '../../../navigation/types';

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
  const productLabel = state.productType === 'kasko' ? 'КАСКО' : 'ОСАГО';

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

        {car && (
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
              {calc.total.toLocaleString('ru-RU')}
            </Text>
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMutedDark }}>
              сум
            </Text>
          </View>
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
            Перейти к оплате · {calc.total.toLocaleString('ru-RU')} сум
          </RedButton>
        </View>
      </View>
    </PhoneFrame>
  );
}
