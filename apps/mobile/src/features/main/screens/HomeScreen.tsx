import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMe } from '../../../api/auth';
import { useActiveAdjusterRequest } from '../../../api/adjuster';
import { usePartners } from '../../../api/partners';
import { usePolicies, type Policy } from '../../../api/policies';
import { IconBell } from '../../../components/icons/IconBell';
import {
  QuickIconAdjuster,
  QuickIconEuroProtocol,
  QuickIconPartners,
  QuickIconPolicy,
} from '../../../components/icons/QuickActionIcons';
import { SunIcon } from '../../../components/icons/SunIcon';
import { TabIconUser } from '../../../components/icons/TabIcons';
import { ActionTile } from '../../../components/ui/ActionTile';
import { AddPolicyTile } from '../../../components/ui/AddPolicyTile';
import { AdjusterActiveBanner } from '../../../components/ui/AdjusterActiveBanner';
import { GlassPill } from '../../../components/ui/GlassPill';
import { HScroll } from '../../../components/ui/HScroll';
import { IconButton } from '../../../components/ui/IconButton';
import { PartnerCard } from '../../../components/ui/PartnerCard';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { PolicyCardActive } from '../../../components/ui/PolicyCardActive';
import { ClaimIcon, DetailIcon, PdfIcon, PolicyContextMenu, RenewIcon } from '../../../components/ui/PolicyContextMenu';
import { PromoBanner } from '../../../components/ui/PromoBanner';
import { SectionRow } from '../../../components/ui/SectionRow';
import { SosBanner } from '../../../components/ui/SosBanner';
import { SosLogo } from '../../../components/ui/SosLogo';
import { TopBar } from '../../../components/ui/TopBar';
import { tokens } from '../../../theme/colors';
import type { MainStackParamList, MainTabParamList } from '../../../navigation/types';

type RootNav = NativeStackNavigationProp<MainStackParamList>;
type TabNav = BottomTabNavigationProp<MainTabParamList>;

const PARTNER_TYPE_LABEL: Record<string, string> = {
  STO: 'СТО', CLINIC: 'Клиника', TOWING: 'Эвакуатор',
};

function greetingByHour(hour: number): string {
  if (hour < 5) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}

const PRODUCT_LABEL: Record<Policy['type'], string> = {
  OSAGO: 'ОСАГО',
  KASKO: 'КАСКО',
  HEALTH: 'Здоровье',
  HOME: 'Дом',
  FINANCE: 'Финансы',
};

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

function formatExpiry(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

// Главный экран — длинный скролл по специке: greeting + полисы + SOS-баннер
// + быстрые действия 2×2 + партнёры рядом + промо.
// Эталон: SOS24/screens.jsx → ScreenHomeV2.
export function HomeScreen() {
  const greeting = greetingByHour(new Date().getHours());
  const nav = useNavigation<TabNav>();
  const insets = useSafeAreaInsets();
  const { data: me } = useMe();
  const { data: policies } = usePolicies('ACTIVE');
  const { data: partners = [] } = usePartners();
  const { data: activeRequest } = useActiveAdjusterRequest();
  const displayName = me?.name ?? 'Гость';
  const [menuPolicy, setMenuPolicy] = useState<Policy | null>(null);

  // Переход в профиль (вкладка Profile).
  const openProfile = () => nav.navigate('Profile');

  // Purchase и Adjuster стеки живут на уровне MainStack (sibling к Tabs).
  // Вход в покупку — экран выбора страховой компании.
  const openCatalog = () => {
    const root = nav.getParent<RootNav>();
    if (root) root.navigate('Purchase', { screen: 'CompanySelect' });
  };

  const openAdjuster = () => {
    const root = nav.getParent<RootNav>();
    if (!root) return;
    if (activeRequest) {
      root.navigate('Adjuster', { screen: 'AdjusterStatus', params: { requestId: activeRequest.id } });
    } else {
      root.navigate('Adjuster');
    }
  };

  const openEuro = () => {
    const root = nav.getParent<RootNav>();
    if (root) root.navigate('EuroProtocol');
  };

  // nav здесь — Tab navigator, поэтому navigate('Policies', {screen}) работает напрямую.
  const openQr = (id: string) => {
    (nav as any).navigate('Policies', { screen: 'PolicyQrFullscreen', params: { id } });
  };

  const openPolicyDetail = (id: string) => {
    (nav as any).navigate('Policies', { screen: 'PolicyDetail', params: { id } });
  };

  const menuItems = menuPolicy
    ? [
        { label: 'Подробнее', icon: <DetailIcon />, onPress: () => openPolicyDetail(menuPolicy.id) },
        { label: 'Продлить', icon: <RenewIcon />, onPress: openCatalog },
        { label: 'Скачать PDF', icon: <PdfIcon />, onPress: () => Alert.alert('Скоро', 'Скачивание электронного полиса') },
        { label: 'Заявить убыток', icon: <ClaimIcon />, onPress: () => Alert.alert('Скоро', 'Оформление страхового случая'), destructive: true },
      ]
    : [];

  return (
    <PhoneFrame bottomSafeArea={false} topSafeArea={false}>
      <View style={{ flex: 1 }}>
        <PolicyContextMenu
          visible={menuPolicy !== null}
          title={menuPolicy ? `${PRODUCT_LABEL[menuPolicy.type]} · ${menuPolicy.vehicle?.plate ?? ''}` : ''}
          items={menuItems}
          onClose={() => setMenuPolicy(null)}
        />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: insets.top + 64, paddingBottom: 120, gap: 18 }}
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
                {displayName}
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

          {/* Active adjuster request banner */}
          {activeRequest && (
            <View style={{ paddingHorizontal: 24 }}>
              <AdjusterActiveBanner
                request={activeRequest}
                onPress={openAdjuster}
              />
            </View>
          )}

          {/* Active policies */}
          <View style={{ gap: 12 }}>
            <SectionRow title="Мои полисы" linkLabel="Все" onLinkPress={() => (nav as any).navigate('Policies', { screen: 'PoliciesList' })} />
            <HScroll>
              {policies?.map((p, idx) => {
                const days = daysUntil(p.endDate);
                return (
                  <PolicyCardActive
                    key={p.id}
                    tone={idx === 0 ? 'dark' : 'light'}
                    type={PRODUCT_LABEL[p.type]}
                    car={p.vehicle ? `${p.vehicle.brand} ${p.vehicle.model}` : PRODUCT_LABEL[p.type]}
                    plate={p.vehicle?.plate ?? '—'}
                    daysLeft={days}
                    expiry={formatExpiry(p.endDate)}
                    warn={days < 60}
                    onPress={() => openPolicyDetail(p.id)}
                    onQrPress={() => openQr(p.id)}
                    onMorePress={() => setMenuPolicy(p)}
                  />
                );
              })}
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
                  icon={<QuickIconPolicy />}
                  label={'Страховой\nполис'}
                  onPress={openCatalog}
                />
                <ActionTile
                  icon={<QuickIconAdjuster />}
                  label="Аджастер"
                  activeDot={!!activeRequest}
                  sublabel={activeRequest ? (
                    activeRequest.status === 'NEW' ? 'Ищем аджастера' :
                    activeRequest.status === 'ACCEPTED' ? 'Назначен' :
                    activeRequest.status === 'EN_ROUTE' ? 'В пути' : undefined
                  ) : undefined}
                  onPress={openAdjuster}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <ActionTile icon={<QuickIconPartners />} label="Партнёры" />
                <ActionTile icon={<QuickIconEuroProtocol />} label="Европротокол" onPress={openEuro} />
              </View>
            </View>
          </View>

          {/* Partners */}
          <View style={{ gap: 12 }}>
            <SectionRow title="Партнёры рядом" linkLabel="Все" />
            <HScroll>
              {partners.map((p) => (
                <PartnerCard
                  key={p.id}
                  name={p.name}
                  type={PARTNER_TYPE_LABEL[p.type] ?? p.type}
                  rating={p.rating.toFixed(1)}
                  distance={p.address}
                  open={p.isOpen}
                />
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

        {/* Fade-overlay сверху: контент мягко исчезает за status bar / DI. */}
        <LinearGradient
          pointerEvents="none"
          colors={[tokens.pageBg, 'rgba(228,228,228,0)']}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, height: insets.top + 24 }}
        />

        {/* TopBar — floating, без фона. Контент скроллится под ним.
            Сдвинут на safe-area top inset, чтобы не уходить под dynamic island. */}
        <View style={{ position: 'absolute', top: insets.top, left: 0, right: 0, paddingTop: 8, paddingBottom: 8 }}>
          <TopBar
            leading={
              <IconButton onPress={openProfile}>
                <TabIconUser color={tokens.inkDark} size={20} />
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

        {/* Fade-overlay над native tab bar: контент мягко исчезает к низу.
            Начальный цвет = pageBg с альфой 0 (не 'transparent', который
            rgba(0,0,0,0) и даёт грязный серый в середине gradient).
            pointerEvents=none — не блокирует тапы по контенту/tab bar. */}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(228,228,228,0)', tokens.pageBg]}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 110 }}
        />
      </View>
    </PhoneFrame>
  );
}
