import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScrollView, View } from 'react-native';
import {
  BenefitBolt,
  BenefitCarLock,
  BenefitCommissar,
  BenefitHospital,
  BenefitMap,
  BenefitProperty,
  BenefitShield,
  BenefitWrench,
} from '../../../components/icons/BenefitIcons';
import { BackButton } from '../../../components/ui/BackButton';
import { DiscountStripe } from '../../../components/ui/DiscountStripe';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { ProductCard } from '../../../components/ui/ProductCard';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { tokens } from '../../../theme/colors';
import type { PurchaseStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<PurchaseStackParamList, 'Catalog'>;

// M4.1 — Каталог продуктов. Эталон: SOS24/screens-policy.jsx → ScreenCatalog.
export function CatalogScreen() {
  const nav = useNavigation<Nav>();

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
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeading title="Страхование" subtitle="Оформите полис онлайн за пару минут" />

        <View style={{ gap: 12 }}>
          <ProductCard
            tone="light"
            eyebrow="Обязательное"
            name="ОСАГО"
            subtitle="Страхование гражданской ответственности"
            benefits={[
              { icon: <BenefitBolt color={tokens.red} />, label: 'Электронный полис мгновенно' },
              { icon: <BenefitMap color={tokens.red} />, label: 'Действует по всему Узбекистану' },
              { icon: <BenefitShield color={tokens.red} />, label: 'Онлайн-оформление, без офиса' },
            ]}
            price="от 285 000"
            onPress={() => nav.navigate('ProductDetail', { type: 'osago' })}
          />
          <ProductCard
            tone="dark"
            eyebrow="Полное покрытие"
            name="КАСКО"
            subtitle="Комплексное страхование автомобиля"
            benefits={[
              { icon: <BenefitCarLock color="#fff" />, label: 'Угон и ущерб от третьих лиц' },
              { icon: <BenefitCommissar color="#fff" />, label: 'Вызов инспектора 24/7' },
              { icon: <BenefitWrench color="#fff" />, label: 'Сеть партнёрских СТО' },
            ]}
            price="от 4 200 000"
            onPress={() => nav.navigate('ProductDetail', { type: 'kasko' })}
          />
          <ProductCard
            tone="light"
            eyebrow="Жизнь и здоровье"
            name="Здоровье"
            subtitle="Защита при болезни и несчастных случаях"
            benefits={[
              { icon: <BenefitHospital color={tokens.red} />, label: 'Госпитализация и амбулаторное лечение' },
              { icon: <BenefitMap color={tokens.red} />, label: 'Сеть клиник по всему Узбекистану' },
              { icon: <BenefitShield color={tokens.red} />, label: 'Выплаты до 50 000 000 сум' },
            ]}
            price="от 1 200 000"
            onPress={() => nav.navigate('ProductDetail', { type: 'health' })}
          />
          <ProductCard
            tone="light"
            eyebrow="Имущество"
            name="Дом и имущество"
            subtitle="Защита квартиры или дома от рисков"
            benefits={[
              { icon: <BenefitProperty color={tokens.red} />, label: 'Пожар, залив, стихийные бедствия' },
              { icon: <BenefitCarLock color={tokens.red} />, label: 'Кража со взломом и грабёж' },
              { icon: <BenefitShield color={tokens.red} />, label: 'Ответственность перед соседями' },
            ]}
            price="от 2 800 000"
            onPress={() => nav.navigate('ProductDetail', { type: 'home' })}
          />
          <ProductCard
            tone="light"
            eyebrow="Финансовая защита"
            name="Финансовая защита"
            subtitle="Поддержка при потере дохода"
            benefits={[
              { icon: <BenefitShield color={tokens.red} />, label: 'Покрытие кредитных платежей' },
              { icon: <BenefitBolt color={tokens.red} />, label: 'Выплата при потере работы' },
              { icon: <BenefitWrench color={tokens.red} />, label: 'Юридическое сопровождение' },
            ]}
            price="от 800 000"
            onPress={() => nav.navigate('ProductDetail', { type: 'finance' })}
          />
          <DiscountStripe
            title="Скидка 10% при оплате до 31 мая"
            hint="Промокод SOS10 применится автоматически"
          />
        </View>
      </ScrollView>
    </PhoneFrame>
  );
}
