import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScrollView, View } from 'react-native';
import {
  BenefitBolt,
  BenefitCarLock,
  BenefitCommissar,
  BenefitMap,
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
              { icon: <BenefitCommissar color="#fff" />, label: 'Вызов комиссара 24/7' },
              { icon: <BenefitWrench color="#fff" />, label: 'Сеть партнёрских СТО' },
            ]}
            price="от 4 200 000"
            onPress={() => nav.navigate('ProductDetail', { type: 'kasko' })}
          />
          <DiscountStripe
            title="Скидка 10% при оплате до 31 мая"
            hint="Промокод применится автоматически"
          />
        </View>
      </ScrollView>
    </PhoneFrame>
  );
}
