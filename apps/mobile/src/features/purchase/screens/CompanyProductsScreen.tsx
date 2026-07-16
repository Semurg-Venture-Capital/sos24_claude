import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
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

// Временно: покупка полисов недоступна (нет финансов) — карточки показывают
// бейдж «Скоро» и неактивную кнопку. Вернуть покупку → false.
const PURCHASE_COMING_SOON = true;

type Nav = NativeStackNavigationProp<PurchaseStackParamList, 'CompanyProducts'>;
type R = RouteProp<PurchaseStackParamList, 'CompanyProducts'>;

type IconComp = ComponentType<{ color?: string }>;

// Пресеты оформления карточки по типу продукта (как в дизайне старого каталога):
// тон, eyebrow и 3 преимущества с иконками. Список с бэка не отдаёт benefits,
// поэтому держим их здесь по типу страхования. Тексты — через i18n
// (ключи purchase.products.eyebrow.* и purchase.products.benefits.*).
const PRESET: Record<ApiProductType, { tone: 'light' | 'dark'; key: string; benefits: { Icon: IconComp; idx: number }[] }> = {
  OSAGO: {
    tone: 'light',
    key: 'OSAGO',
    benefits: [
      { Icon: BenefitBolt, idx: 0 },
      { Icon: BenefitMap, idx: 1 },
      { Icon: BenefitShield, idx: 2 },
    ],
  },
  KASKO: {
    tone: 'dark',
    key: 'KASKO',
    benefits: [
      { Icon: BenefitCarLock, idx: 0 },
      { Icon: BenefitCommissar, idx: 1 },
      { Icon: BenefitWrench, idx: 2 },
    ],
  },
  HEALTH: {
    tone: 'light',
    key: 'HEALTH',
    benefits: [
      { Icon: BenefitHospital, idx: 0 },
      { Icon: BenefitMap, idx: 1 },
      { Icon: BenefitShield, idx: 2 },
    ],
  },
  HOME: {
    tone: 'light',
    key: 'HOME',
    benefits: [
      { Icon: BenefitProperty, idx: 0 },
      { Icon: BenefitCarLock, idx: 1 },
      { Icon: BenefitShield, idx: 2 },
    ],
  },
  FINANCE: {
    tone: 'light',
    key: 'FINANCE',
    benefits: [
      { Icon: BenefitShield, idx: 0 },
      { Icon: BenefitBolt, idx: 1 },
      { Icon: BenefitWrench, idx: 2 },
    ],
  },
  LIFE: {
    tone: 'light',
    key: 'LIFE',
    benefits: [
      { Icon: BenefitShield, idx: 0 },
      { Icon: BenefitHospital, idx: 1 },
      { Icon: BenefitBolt, idx: 2 },
    ],
  },
  TRAVEL: {
    tone: 'light',
    key: 'TRAVEL',
    benefits: [
      { Icon: BenefitMap, idx: 0 },
      { Icon: BenefitShield, idx: 1 },
      { Icon: BenefitBolt, idx: 2 },
    ],
  },
  OTHER: {
    tone: 'light',
    key: 'OTHER',
    benefits: [
      { Icon: BenefitShield, idx: 0 },
      { Icon: BenefitMap, idx: 1 },
      { Icon: BenefitBolt, idx: 2 },
    ],
  },
};

// Шаг 2 нового флоу — продукты выбранной компании (дизайн карточек как в каталоге).
export function CompanyProductsScreen() {
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();
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
        <ScreenHeading title={t('purchase.products.title')} subtitle={t('purchase.products.subtitle')} />

        {isLoading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator color={tokens.red} />
          </View>
        ) : isError ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', gap: 12 }}>
            <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 14, color: tokens.inkMuted }}>{t('purchase.products.loadError')}</Text>
            <Pressable onPress={() => refetch()} style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, backgroundColor: tokens.red }}>
              <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: '#fff' }}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : !products?.length ? (
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted, textAlign: 'center', paddingVertical: 40 }}>
            {t('purchase.products.empty')}
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
  const { t } = useTranslation();
  const preset = PRESET[product.type] ?? PRESET.OTHER;
  const iconColor = preset.tone === 'dark' ? '#fff' : tokens.red;
  return (
    <ProductCard
      tone={preset.tone}
      eyebrow={t(`purchase.products.eyebrow.${preset.key}`)}
      name={product.name}
      subtitle={product.shortDescription ?? ''}
      benefits={preset.benefits.map((b) => ({ icon: <b.Icon color={iconColor} />, label: t(`purchase.products.benefits.${preset.key}.${b.idx}`) }))}
      price={product.fromPrice != null ? product.fromPrice.toLocaleString('ru-RU') : '—'}
      onPress={onPress}
      comingSoon={PURCHASE_COMING_SOON}
    />
  );
}
