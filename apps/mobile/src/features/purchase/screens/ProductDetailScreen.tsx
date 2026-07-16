import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { BenefitShield } from '../../../components/icons/BenefitIcons';
import { useInsuranceProduct, apiTypeToLocal, type ProductPlan } from '../../../api/insurance';
import { BackButton } from '../../../components/ui/BackButton';
import { BenefitRow } from '../../../components/ui/BenefitRow';
import { ExceptionRow } from '../../../components/ui/ExceptionRow';
import { FaqRow } from '../../../components/ui/FaqRow';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { Section } from '../../../components/ui/Section';
import { StepRow } from '../../../components/ui/StepRow';
import { Tag } from '../../../components/ui/Tag';
import { tokens } from '../../../theme/colors';
import { usePurchaseStore } from '../store';
import type { PurchaseStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<PurchaseStackParamList, 'ProductDetail'>;
type R = RouteProp<PurchaseStackParamList, 'ProductDetail'>;

// M4.2 — Детальная карточка продукта (данные из API). Для продуктов с тарифными
// планами показываем выбор плана; для авто (COEFFICIENT) — сразу калькулятор.
export function ProductDetailScreen() {
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();
  const { productId } = useRoute<R>().params;
  const { data: product, isLoading, isError, refetch } = useInsuranceProduct(productId);
  const [planId, setPlanId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <PhoneFrame>
        <Header onBack={() => nav.goBack()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.red} />
        </View>
      </PhoneFrame>
    );
  }

  if (isError || !product) {
    return (
      <PhoneFrame>
        <Header onBack={() => nav.goBack()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 }}>
          <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 14, color: tokens.inkMuted }}>{t('purchase.detail.loadError')}</Text>
          <Pressable onPress={() => refetch()} style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, backgroundColor: tokens.red }}>
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: '#fff' }}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      </PhoneFrame>
    );
  }

  const content = product.content ?? {};
  const isPlans = product.pricingMode === 'PLANS';
  const canProceed = !isPlans || !!planId;

  const proceed = () => {
    const localType = apiTypeToLocal(product.type);
    usePurchaseStore.getState().startProduct({
      companyId: product.company.id,
      productId: product.id,
      productType: localType,
      pricingMode: product.pricingMode,
      baseRate: product.baseRate,
    });

    if (isPlans) {
      const plan = product.plans.find((p) => p.id === planId);
      if (!plan) return;
      usePurchaseStore.getState().setPlan(plan.id, plan.price);
      nav.navigate('Checkout');
    } else {
      // авто (ОСАГО/КАСКО) — полный калькулятор
      nav.navigate('CalcVehicle');
    }
  };

  return (
    <PhoneFrame>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 }}>
        <BackButton onPress={() => nav.goBack()} />
        <Tag tone="ink">{product.company.name}</Tag>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 160, paddingTop: 8, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeading title={product.name} subtitle={product.longDescription ?? product.shortDescription ?? undefined} />

        {/* Тарифные планы — для продуктов с планами */}
        {isPlans && product.plans.length > 0 ? (
          <Section title={t('purchase.detail.selectPlan')}>
            <View style={{ gap: 10 }}>
              {product.plans.map((p) => (
                <PlanCard key={p.id} plan={p} selected={planId === p.id} onPress={() => setPlanId(p.id)} />
              ))}
            </View>
          </Section>
        ) : null}

        {content.covers?.length ? (
          <Section title={t('purchase.detail.covers')}>
            {content.covers.map((c, i) => (
              <BenefitRow key={i} icon={<BenefitShield color={tokens.red} />} title={c.title} body={c.body} />
            ))}
          </Section>
        ) : null}

        {content.exceptions?.length ? (
          <Section title={t('purchase.detail.exceptions')}>
            {content.exceptions.map((t, i) => (
              <ExceptionRow key={i} text={t} />
            ))}
          </Section>
        ) : null}

        {content.steps?.length ? (
          <Section title={t('purchase.detail.howItWorks')}>
            {content.steps.map((s, i) => (
              <StepRow key={i} num={i + 1} title={s.title} body={s.body} />
            ))}
          </Section>
        ) : null}

        {content.faqs?.length ? (
          <Section title={t('purchase.detail.faq')}>
            {content.faqs.map((f, i) => (
              <FaqRow key={i} question={f.question} answer={f.answer} defaultOpen={i === 0} />
            ))}
          </Section>
        ) : null}
      </ScrollView>

      {/* Sticky CTA */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <LinearGradient colors={['rgba(228,228,228,0)', 'rgba(228,228,228,0.95)']} style={{ height: 24 }} />
        <View style={{ paddingHorizontal: 24, paddingBottom: 32, paddingTop: 8, backgroundColor: 'rgba(228,228,228,0.95)' }}>
          {isPlans && !planId ? (
            <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12.5, color: tokens.inkMuted, textAlign: 'center', marginBottom: 8 }}>
              {t('purchase.detail.selectPlanHint')}
            </Text>
          ) : null}
          <RedButton onPress={proceed} disabled={!canProceed}>
            {isPlans ? t('purchase.detail.checkout') : t('purchase.detail.calculate')}
          </RedButton>
        </View>
      </View>
    </PhoneFrame>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 }}>
      <BackButton onPress={onBack} />
    </View>
  );
}

function PlanCard({ plan, selected, onPress }: { plan: ProductPlan; selected: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      style={{
        padding: 16,
        borderRadius: 18,
        backgroundColor: selected ? tokens.inkDark : 'rgba(255,255,255,0.6)',
        borderWidth: 1.5,
        borderColor: selected ? tokens.inkDark : tokens.hairline,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 16, color: selected ? '#fff' : tokens.inkDark }}>{plan.name}</Text>
        {selected ? (
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 12l5 5 9-10" />
          </Svg>
        ) : null}
      </View>
      <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 18, color: selected ? '#fff' : tokens.red }}>
        {plan.price.toLocaleString('ru-RU')} {t('purchase.common.sum')}
      </Text>
      {plan.coverageAmount ? (
        <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12.5, color: selected ? 'rgba(255,255,255,0.7)' : tokens.inkMuted }}>
          {t('purchase.detail.coverageUpTo', { amount: plan.coverageAmount.toLocaleString('ru-RU') })}
        </Text>
      ) : null}
      {plan.features?.length ? (
        <View style={{ gap: 4, marginTop: 2 }}>
          {plan.features.map((f, i) => (
            <Text key={i} style={{ fontFamily: 'Manrope_400Regular', fontSize: 12.5, color: selected ? 'rgba(255,255,255,0.82)' : tokens.inkMuted }}>
              • {f}
            </Text>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}
