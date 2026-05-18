import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScrollView, Text, View } from 'react-native';
import { IconBell } from '../../../components/icons/IconBell';
import { IconBurger } from '../../../components/icons/IconBurger';
import {
  QuickIconCommissar,
  QuickIconHistory,
  QuickIconKASKO,
  QuickIconOSAGO,
} from '../../../components/icons/QuickActionIcons';
import { SunIcon } from '../../../components/icons/SunIcon';
import { ActionTile } from '../../../components/ui/ActionTile';
import { AddPolicyTile } from '../../../components/ui/AddPolicyTile';
import { GlassPill } from '../../../components/ui/GlassPill';
import { HScroll } from '../../../components/ui/HScroll';
import { IconButton } from '../../../components/ui/IconButton';
import { PartnerCard } from '../../../components/ui/PartnerCard';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { PolicyCardActive } from '../../../components/ui/PolicyCardActive';
import { PromoBanner } from '../../../components/ui/PromoBanner';
import { SectionRow } from '../../../components/ui/SectionRow';
import { SosBanner } from '../../../components/ui/SosBanner';
import { SosLogo } from '../../../components/ui/SosLogo';
import { TopBar } from '../../../components/ui/TopBar';
import { tokens } from '../../../theme/colors';
import type { MainStackParamList } from '../../../navigation/types';

type RootNav = NativeStackNavigationProp<MainStackParamList>;

// TODO: mock-данные — заменить на /me/policies и /partners когда подключим API.
const MOCK_POLICIES = [
  { type: 'КАСКО', car: 'Chevrolet Cobalt', plate: '01 A 123 BB', daysLeft: 365, expiry: '11.05.2027', tone: 'dark' as const },
  { type: 'ОСАГО', car: 'Hyundai Sonata', plate: '10 R 555 AC', daysLeft: 43, expiry: '26.06.2026', tone: 'light' as const, warn: true },
];

const MOCK_PARTNERS = [
  { name: 'AutoFix СТО', type: 'СТО', rating: '4.8', distance: '0.4 км', open: true },
  { name: 'Медсервис', type: 'Клиника', rating: '4.6', distance: '1.2 км', open: true },
  { name: 'АвтоЦентр', type: 'СТО', rating: '4.5', distance: '2.1 км', open: false },
  { name: 'Эвак-24', type: 'Эвак.', rating: '4.9', distance: '3.0 км', open: true },
];

function greetingByHour(hour: number): string {
  if (hour < 5) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}

// Главный экран — длинный скролл по специке: greeting + полисы + SOS-баннер
// + быстрые действия 2×2 + партнёры рядом + промо.
// Эталон: SOS24/screens.jsx → ScreenHomeV2.
export function HomeScreen() {
  const greeting = greetingByHour(new Date().getHours());
  const nav = useNavigation();

  // Purchase-стек живёт на уровне MainStack (sibling к Tabs).
  // Используем getParent() для надёжного перехода — useNavigation() внутри
  // HomeScreen возвращает navigation таба, а Purchase route на уровне выше.
  const openCatalog = () => {
    const root = nav.getParent<RootNav>();
    if (root) {
      root.navigate('Purchase', { screen: 'Catalog' });
    }
  };

  const openProduct = (type: 'osago' | 'kasko') => {
    const root = nav.getParent<RootNav>();
    if (root) {
      root.navigate('Purchase', { screen: 'ProductDetail', params: { type } });
    }
  };

  return (
    <PhoneFrame>
      <View style={{ flex: 1 }}>
        {/* Top bar: burger / logo pill / bell. Position absolute over scroll */}
        <View style={{ paddingTop: 8, paddingBottom: 8 }}>
          <TopBar
            leading={
              <IconButton>
                <IconBurger color={tokens.inkDark} />
              </IconButton>
            }
            center={
              <GlassPill style={{ height: 48, paddingHorizontal: 18 }}>
                <SosLogo size="md" />
              </GlassPill>
            }
            trailing={
              <IconButton badge>
                <IconBell color={tokens.inkDark} />
              </IconButton>
            }
          />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 120, gap: 18 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Greeting + weather */}
          <View
            style={{
              paddingHorizontal: 24,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
            }}
          >
            <View style={{ gap: 2 }}>
              <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted }}>
                {greeting}
              </Text>
              <Text
                style={{
                  fontFamily: 'NeueMontreal-Medium',
                  fontSize: 26,
                  letterSpacing: -0.26,
                  color: tokens.ink,
                  lineHeight: 28,
                }}
              >
                Азиз
              </Text>
            </View>
            <GlassPill style={{ height: 34, paddingHorizontal: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <SunIcon size={14} />
                <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12, color: tokens.inkDark }}>
                  +22° Ташкент
                </Text>
              </View>
            </GlassPill>
          </View>

          {/* Active policies */}
          <View style={{ gap: 12 }}>
            <SectionRow title="Мои полисы" linkLabel="Все" />
            <HScroll>
              {MOCK_POLICIES.map((p) => (
                <PolicyCardActive
                  key={p.plate}
                  tone={p.tone}
                  type={p.type}
                  car={p.car}
                  plate={p.plate}
                  daysLeft={p.daysLeft}
                  expiry={p.expiry}
                  warn={p.warn}
                />
              ))}
              <AddPolicyTile onPress={openCatalog} />
            </HScroll>
          </View>

          {/* SOS banner */}
          <View style={{ paddingHorizontal: 24 }}>
            <SosBanner />
          </View>

          {/* Quick actions 2x2 */}
          <View style={{ gap: 12 }}>
            <SectionRow title="Быстрые действия" />
            <View style={{ paddingHorizontal: 24, gap: 10 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <ActionTile
                  dark
                  icon={<QuickIconOSAGO />}
                  label="Оформить ОСАГО"
                  onPress={() => openProduct('osago')}
                />
                <ActionTile
                  icon={<QuickIconKASKO />}
                  label="Оформить КАСКО"
                  onPress={() => openProduct('kasko')}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <ActionTile icon={<QuickIconCommissar />} label={'Вызвать\nкомиссара'} />
                <ActionTile icon={<QuickIconHistory />} label={'История\nполисов'} />
              </View>
            </View>
          </View>

          {/* Partners */}
          <View style={{ gap: 12 }}>
            <SectionRow title="Партнёры рядом" linkLabel="Все" />
            <HScroll>
              {MOCK_PARTNERS.map((p) => (
                <PartnerCard key={p.name} {...p} />
              ))}
            </HScroll>
          </View>

          {/* Promo */}
          <View style={{ gap: 12 }}>
            <SectionRow title="Акции" linkLabel="Все" />
            <View style={{ paddingHorizontal: 24 }}>
              <PromoBanner
                badge="Спецпредложение"
                title={'КАСКО со скидкой 15%\nпри продлении'}
                validUntil="До 31 мая"
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </PhoneFrame>
  );
}
