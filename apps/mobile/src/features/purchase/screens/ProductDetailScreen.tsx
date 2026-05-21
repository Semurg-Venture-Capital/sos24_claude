import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, View } from 'react-native';
import {
  BenefitBolt,
  BenefitCarHit,
  BenefitCarLock,
  BenefitCommissar,
  BenefitHospital,
  BenefitProperty,
  BenefitShield,
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
      { question: 'Что делать при ДТП?', answer: 'Используйте кнопку «Сообщить о ДТП» в приложении — вызов инспектора и фото-фиксация прямо с телефона.' },
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
  health: {
    covers: [
      { icon: <BenefitHospital color={tokens.red} />, title: 'Госпитализация', body: 'Стационарное лечение в любой клинике сети' },
      { icon: <BenefitBolt color={tokens.red} />, title: 'Срочные выплаты', body: 'На лечение в течение 3 рабочих дней' },
      { icon: <BenefitShield color={tokens.red} />, title: 'Тяжёлые состояния', body: 'Единовременная выплата до 50 млн сум' },
    ],
    exceptions: [
      'Лечение хронических заболеваний, существовавших до полиса',
      'Косметология и эстетическая медицина',
      'Лечение в результате опьянения',
    ],
    steps: [
      { title: 'Заполните анкету', body: 'Несколько данных о здоровье' },
      { title: 'Выберите сумму покрытия', body: 'От 10 до 100 млн сум' },
      { title: 'Оплатите онлайн', body: 'Карта или кошелёк SOS24' },
      { title: 'Получите е-полис', body: 'Действует с момента оплаты' },
    ],
    faqs: [
      { question: 'Нужно ли проходить медосмотр?', answer: 'Для базового пакета — нет. Для покрытий свыше 30 млн нужна анкета.' },
      { question: 'Как обратиться при болезни?', answer: 'Через приложение или единый колл-центр 1052.' },
      { question: 'Когда полис начинает действовать?', answer: 'Лечение покрывается с 31-го дня после оплаты — стандартный срок выжидания.' },
    ],
  },
  home: {
    covers: [
      { icon: <BenefitProperty color={tokens.red} />, title: 'Стены и отделка', body: 'Восстановление после пожара, залива, стихийных бедствий' },
      { icon: <BenefitCarLock color={tokens.red} />, title: 'Кража и грабёж', body: 'Возмещение похищенного имущества' },
      { icon: <BenefitShield color={tokens.red} />, title: 'Перед соседями', body: 'Если затопили или повредили чужое имущество' },
    ],
    exceptions: [
      'Ущерб от изношенных коммуникаций без обслуживания',
      'Имущество вне страхуемого помещения',
      'Военные действия и террор',
    ],
    steps: [
      { title: 'Опишите объект', body: 'Тип, площадь, адрес' },
      { title: 'Выберите риски', body: 'Базовый или расширенный пакет' },
      { title: 'Оплатите онлайн', body: 'Карта или кошелёк SOS24' },
      { title: 'Получите е-полис', body: 'Действует с момента оплаты' },
    ],
    faqs: [
      { question: 'Нужен ли осмотр квартиры?', answer: 'Для сумм страхования до 200 млн — нет, достаточно фото. Свыше — приедет агент.' },
      { question: 'Что делать при затоплении соседей?', answer: 'Сразу зафиксируйте через приложение и вызовите ЖЭК — выплата в течение 14 дней.' },
      { question: 'Можно ли застраховать арендованную квартиру?', answer: 'Можно — полис покрывает только ваше имущество и ответственность.' },
    ],
  },
  finance: {
    covers: [
      { icon: <BenefitShield color={tokens.red} />, title: 'Потеря работы', body: 'Платежи покрываются до 6 месяцев' },
      { icon: <BenefitBolt color={tokens.red} />, title: 'Временная нетрудоспособность', body: 'При больничном свыше 30 дней' },
      { icon: <BenefitHospital color={tokens.red} />, title: 'Несчастный случай', body: 'Единовременная выплата при инвалидности' },
    ],
    exceptions: [
      'Увольнение по статье или по соглашению сторон',
      'Безработица в течение первых 90 дней действия полиса',
      'Самозанятость и фриланс без официального трудоустройства',
    ],
    steps: [
      { title: 'Укажите кредит', body: 'Сумма, банк, срок' },
      { title: 'Выберите риски', body: 'Один, несколько или полный пакет' },
      { title: 'Оплатите онлайн', body: 'Карта или кошелёк SOS24' },
      { title: 'Получите е-полис', body: 'Действует с момента оплаты' },
    ],
    faqs: [
      { question: 'Можно ли застраховать ипотеку?', answer: 'Да, мы работаем со всеми банками Узбекистана.' },
      { question: 'Что считается потерей работы?', answer: 'Сокращение, ликвидация работодателя, окончание трудового договора по инициативе работодателя.' },
      { question: 'Как получить выплату?', answer: 'После 30-го дня безработицы — через приложение, выплата на ваш карточный счёт.' },
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
              const t = route.params.type;
              usePurchaseStore.getState().resetForProduct(t);
              // ОСАГО/КАСКО — полный калькулятор. Остальные продукты — фикс-цена,
              // сразу в Checkout (без выбора авто/водителей/периода).
              if (t === 'osago' || t === 'kasko') {
                nav.navigate('CalcVehicle');
              } else {
                nav.navigate('Checkout');
              }
            }}
          >
            Рассчитать стоимость
          </RedButton>
        </View>
      </View>
    </PhoneFrame>
  );
}

