import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, View } from 'react-native';
import {
  BenefitCarHit,
  BenefitCarLock,
  BenefitCommissar,
  BenefitHospital,
  BenefitProperty,
  BenefitWrench,
} from '../../../components/icons/BenefitIcons';
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
import { PRODUCTS, type ProductType } from '../productData';
import { usePurchaseStore } from '../store';
import type { PurchaseStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<PurchaseStackParamList, 'ProductDetail'>;
type R = RouteProp<PurchaseStackParamList, 'ProductDetail'>;

// Контент детальной для каждого продукта.
const CONTENT: Record<ProductType, {
  covers: Array<{ icon: React.ReactNode; title: string; body: string }>;
  exceptions: string[];
  steps: Array<{ title: string; body: string }>;
  faqs: Array<{ question: string; answer?: string }>;
}> = {
  osago: {
    covers: [
      { icon: <BenefitCarHit color={tokens.red} />, title: 'Ущерб транспорту', body: 'Ремонт автомобиля пострадавшего' },
      { icon: <BenefitHospital color={tokens.red} />, title: 'Вред здоровью', body: 'Лечение пострадавших в ДТП' },
      { icon: <BenefitProperty color={tokens.red} />, title: 'Имущественный ущерб', body: 'Ограждения, столбы, фасады' },
    ],
    exceptions: [
      'Ущерб собственному автомобилю',
      'Алкогольное и наркотическое опьянение',
      'ДТП вне территории Узбекистана',
    ],
    steps: [
      { title: 'Введите номер авто', body: 'Данные подтянутся из NAPP' },
      { title: 'Выберите параметры', body: 'Срок, водители, период' },
      { title: 'Оплатите онлайн', body: 'Карта Uzcard или Humo' },
      { title: 'Получите е-полис', body: 'Мгновенно в приложении' },
    ],
    faqs: [
      { question: 'Действует ли полис в первый день?', answer: 'Да, после успешной оплаты полис активируется через 1 час.' },
      { question: 'Что делать при ДТП?', answer: 'Используйте кнопку «Сообщить о ДТП» в приложении — вызов комиссара и фото-фиксация прямо с телефона.' },
      { question: 'Можно ли продлить полис?', answer: 'Да, кнопка «Продлить» появляется в деталях полиса за 30 дней до истечения.' },
    ],
  },
  kasko: {
    covers: [
      { icon: <BenefitCarLock color={tokens.red} />, title: 'Угон автомобиля', body: 'Полная компенсация при угоне' },
      { icon: <BenefitCommissar color={tokens.red} />, title: 'Ущерб от ДТП', body: 'По вашей вине или без виновника' },
      { icon: <BenefitWrench color={tokens.red} />, title: 'Стихийные бедствия', body: 'Град, пожар, наводнение, дерево' },
    ],
    exceptions: [
      'Естественный износ автомобиля',
      'Управление без прав соответствующей категории',
      'Использование в коммерческих целях без декларации',
    ],
    steps: [
      { title: 'Введите номер авто', body: 'Данные подтянутся из NAPP' },
      { title: 'Выберите покрытие', body: 'Угон, ущерб, доп. опции' },
      { title: 'Оплатите онлайн', body: 'Можно в рассрочку до 12 мес' },
      { title: 'Получите е-полис', body: 'Мгновенно в приложении' },
    ],
    faqs: [
      { question: 'Нужен ли осмотр авто перед оформлением?', answer: 'Да, для новых полисов КАСКО требуется фото-осмотр через приложение. Занимает 5 минут.' },
      { question: 'Что если виновник — я?', answer: 'КАСКО покрывает ущерб вашему авто независимо от вины. В отличие от ОСАГО, который покрывает только ущерб другим.' },
      { question: 'Можно ли менять список водителей?', answer: 'Да, через приложение в течение действия полиса. Перерасчёт премии — автоматический.' },
    ],
  },
};

// M4.2 — Детальная страница продукта. Эталон: ScreenProductDetail.
export function ProductDetailScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<R>();
  const product = PRODUCTS[route.params.type];
  const content = CONTENT[route.params.type];

  return (
    <PhoneFrame>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 8,
        }}
      >
        <BackButton onPress={() => nav.goBack()} />
        <Tag tone="ink">{product.name}</Tag>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 160, paddingTop: 8, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeading
          title={`${product.longTitle[0]}\n${product.longTitle[1]}`}
          subtitle={product.longDescription}
        />

        <Section title="Что покрывает">
          {content.covers.map((c, i) => (
            <BenefitRow key={i} icon={c.icon} title={c.title} body={c.body} />
          ))}
        </Section>

        <Section title="Что не покрывает">
          {content.exceptions.map((t, i) => (
            <ExceptionRow key={i} text={t} />
          ))}
        </Section>

        <Section title="Как это работает">
          {content.steps.map((s, i) => (
            <StepRow key={i} num={i + 1} title={s.title} body={s.body} />
          ))}
        </Section>

        <Section title="Вопросы и ответы">
          {content.faqs.map((f, i) => (
            <FaqRow key={i} question={f.question} answer={f.answer} defaultOpen={i === 0} />
          ))}
        </Section>
      </ScrollView>

      {/* Sticky CTA — градиент-фейд снизу + красная кнопка */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <LinearGradient
          colors={['rgba(228,228,228,0)', 'rgba(228,228,228,0.95)']}
          style={{ height: 24 }}
        />
        <View style={{ paddingHorizontal: 24, paddingBottom: 32, paddingTop: 8, backgroundColor: 'rgba(228,228,228,0.95)' }}>
          <RedButton
            onPress={() => {
              usePurchaseStore.getState().resetForProduct(route.params.type);
              nav.navigate('CalcVehicle');
            }}
          >
            Рассчитать стоимость
          </RedButton>
        </View>
      </View>
    </PhoneFrame>
  );
}

