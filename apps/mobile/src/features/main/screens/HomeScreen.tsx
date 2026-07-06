import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMe } from '../../../api/auth';
import { useActiveAdjusterRequest } from '../../../api/adjuster';
import { useNearbyPartners } from '../../../api/partners';
import { usePolicies, type Policy } from '../../../api/policies';
import { IconBell } from '../../../components/icons/IconBell';
import {
  QuickIconAdjuster,
  QuickIconEuroProtocol,
  QuickIconPartners,
  QuickIconPolicy,
} from '../../../components/icons/QuickActionIcons';
import { TabIconUser } from '../../../components/icons/TabIcons';
import { WeatherIcon } from '../../../components/icons/WeatherIcons';
import { useWeather } from '../../../api/weather';
import { useUnreadCount } from '../../../api/notifications';
import { configurePushHandler, registerPushToken } from '../../../lib/push';
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
import { useAuthStore } from '../../../stores/authStore';
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
  const { data: me, isError: meIsError, error: meError, refetch: refetchMe } = useMe();
  const { data: weather, isFetching: weatherFetching, refetch: refetchWeather } = useWeather();
  const { data: unreadCount } = useUnreadCount();
  const signOut = useAuthStore((s) => s.signOut);

  // Ошибка загрузки профиля: 401 (протух/невалиден токен) → выход на логин;
  // прочие ошибки (сеть/сервер) → показываем сообщение (см. ниже).
  const meErrStatus = (meError as { response?: { status?: number } } | null)?.response?.status;
  const meAuthError = meErrStatus === 401 || meErrStatus === 403;
  useEffect(() => {
    if (meIsError && meAuthError) void signOut();
  }, [meIsError, meAuthError, signOut]);

  // Инициализация push: обработчик показа + регистрация токена устройства.
  useEffect(() => {
    configurePushHandler();
    void registerPushToken();
  }, []);
  const { data: policies } = usePolicies('ACTIVE');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const Location = await import('expo-location');
        const perm = await Location.getForegroundPermissionsAsync();
        if (!perm.granted) return;
        const pos = await Location.getLastKnownPositionAsync();
        if (pos) setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        /* без локации просто не показываем «рядом» */
      }
    })();
  }, []);
  const { data: partners = [] } = useNearbyPartners(coords?.lat, coords?.lng, 8);
  const { data: activeRequest } = useActiveAdjusterRequest();

  // Pull-to-refresh: обновляем все активные запросы экрана из бэка.
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([queryClient.refetchQueries({ type: 'active' }), refetchWeather()]);
    } finally {
      setRefreshing(false);
    }
  };
  const displayName = me?.name ?? 'Гость';
  const [menuPolicy, setMenuPolicy] = useState<Policy | null>(null);

  // Переход в профиль (вкладка Profile).
  const openProfile = () => nav.getParent<RootNav>()?.navigate('Profile');

  // Экран уведомлений (живёт на MainStack).
  const openNotifications = () => nav.getParent<RootNav>()?.navigate('Notifications');

  // Партнёры (M16) — каталог; деталь конкретного партнёра.
  const openPartners = () => nav.getParent<RootNav>()?.navigate('Partners');
  const openPartner = (id: string) =>
    nav.getParent<RootNav>()?.navigate('Partners', { screen: 'PartnerDetail', params: { id } });

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

  // QR полиса — корневой модал (на уровне MainStack), не внутри вкладки «Полисы».
  const openQr = (id: string) => {
    nav.getParent<RootNav>()?.navigate('PolicyQrFullscreen', { id });
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

  // Не-авторизационная ошибка загрузки профиля (сеть/сервер) и профиль ещё не
  // загружен — показываем понятное сообщение вместо «Гостя» с пустым экраном.
  if (meIsError && !meAuthError && !me) {
    return (
      <PhoneFrame bottomSafeArea={false} topSafeArea={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 }}>
          <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 20, color: tokens.ink, textAlign: 'center' }}>
            Не удалось загрузить данные
          </Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted, textAlign: 'center', lineHeight: 20 }}>
            {meErrStatus
              ? `Сервер вернул ошибку (${meErrStatus}). Попробуйте позже.`
              : 'Проверьте подключение к интернету и попробуйте снова.'}
          </Text>
          <Pressable
            onPress={() => void refetchMe()}
            style={({ pressed }) => ({
              marginTop: 8,
              height: 48,
              paddingHorizontal: 28,
              borderRadius: 999,
              backgroundColor: tokens.red,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 15, color: '#fff' }}>Повторить</Text>
          </Pressable>
          <Pressable onPress={() => void signOut()} style={({ pressed }) => ({ marginTop: 4, paddingVertical: 8, opacity: pressed ? 0.6 : 1 })}>
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: tokens.inkMuted }}>Войти заново</Text>
          </Pressable>
        </View>
      </PhoneFrame>
    );
  }

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={tokens.red}
              colors={[tokens.red]}
              progressViewOffset={insets.top + 8}
            />
          }
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
            <Pressable onPress={() => refetchWeather()}>
              <GlassPill style={{ height: 34, paddingHorizontal: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {weather ? (
                    <>
                      <WeatherIcon code={weather.code} isDay={weather.isDay} size={15} color={tokens.inkDark} />
                      <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12, color: tokens.inkDark }}>
                        {weather.tempC > 0 ? '+' : ''}
                        {weather.tempC}° {weather.city}
                      </Text>
                    </>
                  ) : weatherFetching ? (
                    <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12, color: tokens.inkMuted }}>Погода…</Text>
                  ) : (
                    <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12, color: tokens.inkMuted }}>Обновить погоду</Text>
                  )}
                </View>
              </GlassPill>
            </Pressable>
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

          {/* SOS banner — экстренная помощь (отдельный модуль, в разработке) */}
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
                <ActionTile icon={<QuickIconPartners />} label="Партнёры" onPress={openPartners} />
                <ActionTile icon={<QuickIconEuroProtocol />} label="Европротокол" onPress={openEuro} />
              </View>
            </View>
          </View>

          {/* Partners */}
          {partners.length > 0 && (
            <View style={{ gap: 12 }}>
              <SectionRow title="Партнёры рядом" linkLabel="Все" onLinkPress={openPartners} />
              <HScroll>
                {partners.map((p) => (
                  <Pressable key={p.id} onPress={() => openPartner(p.id)}>
                    <PartnerCard
                      name={p.name}
                      type={p.category?.name ?? PARTNER_TYPE_LABEL.STO}
                      rating={p.rating.toFixed(1)}
                      distance={p.distanceKm != null ? `${p.distanceKm} км` : p.city}
                      open={p.openNow ?? undefined}
                      logoUrl={p.logoUrl}
                    />
                  </Pressable>
                ))}
              </HScroll>
            </View>
          )}

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
              <IconButton badge={(unreadCount ?? 0) > 0} onPress={openNotifications}>
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
