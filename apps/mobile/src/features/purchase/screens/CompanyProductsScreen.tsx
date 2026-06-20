import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ComponentType } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
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
import { useCompanyProducts, type ApiProductType, type CompanyProduct } from '../../../api/insurance';
import { BackButton } from '../../../components/ui/BackButton';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { ProductCard } from '../../../components/ui/ProductCard';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { Tag } from '../../../components/ui/Tag';
import { tokens } from '../../../theme/colors';
import type { PurchaseStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<PurchaseStackParamList, 'CompanyProducts'>;
type R = RouteProp<PurchaseStackParamList, 'CompanyProducts'>;

type IconComp = ComponentType<{ color?: string }>;

// Пресеты оформления карточки по типу продукта (как в дизайне старого каталога):
// тон, eyebrow и 3 преимущества с иконками. Список с бэка не отдаёт benefits,
// поэтому держим их здесь по типу страхования.
const PRESET: Record<ApiProductType, { tone: 'light' | 'dark'; eyebrow: string; benefits: { Icon: IconComp; label: string }[] }> = {
  OSAGO: {
    tone: 'light',
    eyebrow: 'Обязательное',
    benefits: [
      { Icon: BenefitBolt, label: 'Электронный полис мгновенно' },
      { Icon: BenefitMap, label: 'Действует по всему Узбекистану' },
      { Icon: BenefitShield, label: 'Онлайн-оформление, без офиса' },
    ],
  },
  KASKO: {
    tone: 'dark',
    eyebrow: 'Полное покрытие',
    benefits: [
      { Icon: BenefitCarLock, label: 'Угон и ущерб от третьих лиц' },
      { Icon: BenefitCommissar, label: 'Вызов инспектора 24/7' },
      { Icon: BenefitWrench, label: 'Сеть партнёрских СТО' },
    ],
  },
  HEALTH: {
    tone: 'light',
    eyebrow: 'Жизнь и здоровье',
    benefits: [
      { Icon: BenefitHospital, label: 'Госпитализация и амбулаторное лечение' },
      { Icon: BenefitMap, label: 'Сеть клиник по всему Узбекистану' },
      { Icon: BenefitShield, label: 'Выплаты до 50 000 000 сум' },
    ],
  },
  HOME: {
    tone: 'light',
    eyebrow: 'Имущество',
    benefits: [
      { Icon: BenefitProperty, label: 'Пожар, залив, стихийные бедствия' },
      { Icon: BenefitCarLock, label: 'Кража со взломом и грабёж' },
      { Icon: BenefitShield, label: 'Ответственность перед соседями' },
    ],
  },
  FINANCE: {
    tone: 'light',
    eyebrow: 'Финансовая защита',
    benefits: [
      { Icon: BenefitShield, label: 'Покрытие кредитных платежей' },
      { Icon: BenefitBolt, label: 'Выплата при потере работы' },
      { Icon: BenefitWrench, label: 'Юридическое сопровождение' },
    ],
  },
  LIFE: {
    tone: 'light',
    eyebrow: 'Жизнь',
    benefits: [
      { Icon: BenefitShield, label: 'Выплата близким при несчастном случае' },
      { Icon: BenefitHospital, label: 'Поддержка при тяжёлых заболеваниях' },
      { Icon: BenefitBolt, label: 'Быстрое оформление онлайн' },
    ],
  },
  TRAVEL: {
    tone: 'light',
    eyebrow: 'Путешествия',
    benefits: [
      { Icon: BenefitMap, label: 'Медпомощь за рубежом' },
      { Icon: BenefitShield, label: 'Страховка багажа и отмены поездки' },
      { Icon: BenefitBolt, label: 'Полис для визы за минуту' },
    ],
  },
  OTHER: {
    tone: 'light',
    eyebrow: 'Страхование',
    benefits: [
      { Icon: BenefitShield, label: 'Надёжная защита' },
      { Icon: BenefitMap, label: 'По всему Узбекистану' },
      { Icon: BenefitBolt, label: 'Оформление онлайн' },
    ],
  },
};

// Шаг 2 нового флоу — продукты выбранной компании (дизайн карточек как в каталоге).
export function CompanyProductsScreen() {
  const nav = useNavigation<Nav>();
  const { companyId, companyName } = useRoute<R>().params;
  const { data: products, isLoading, isError, refetch } = useCompanyProducts(companyId);

  return (
    <PhoneFrame>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 }}>
        <BackButton onPress={() => nav.goBack()} />
        <Tag tone="ink">{companyName}</Tag>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeading title="Страхование" subtitle="Выберите продукт и оформите полис онлайн" />

        {isLoading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator color={tokens.red} />
          </View>
        ) : isError ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', gap: 12 }}>
            <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 14, color: tokens.inkMuted }}>Не удалось загрузить продукты</Text>
            <Pressable onPress={() => refetch()} style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, backgroundColor: tokens.red }}>
              <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: '#fff' }}>Повторить</Text>
            </Pressable>
          </View>
        ) : !products?.length ? (
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted, textAlign: 'center', paddingVertical: 40 }}>
            У компании пока нет продуктов
          </Text>
        ) : (
          <View style={{ gap: 12 }}>
            {products.map((p) => (
              <ProductCardFromApi key={p.id} product={p} onPress={() => nav.navigate('ProductDetail', { productId: p.id })} />
            ))}
          </View>
        )}
      </ScrollView>
    </PhoneFrame>
  );
}

function ProductCardFromApi({ product, onPress }: { product: CompanyProduct; onPress: () => void }) {
  const preset = PRESET[product.type] ?? PRESET.OTHER;
  const iconColor = preset.tone === 'dark' ? '#fff' : tokens.red;
  return (
    <ProductCard
      tone={preset.tone}
      eyebrow={preset.eyebrow}
      name={product.name}
      subtitle={product.shortDescription ?? ''}
      benefits={preset.benefits.map((b) => ({ icon: <b.Icon color={iconColor} />, label: b.label }))}
      price={product.fromPrice != null ? product.fromPrice.toLocaleString('ru-RU') : '—'}
      onPress={onPress}
    />
  );
}
