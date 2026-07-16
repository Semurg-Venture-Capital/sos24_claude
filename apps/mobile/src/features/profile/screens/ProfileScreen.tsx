import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Glass } from '../../../components/ui/Glass';
import { useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCollapsingHeader } from '../../../lib/useCollapsingHeader';
import { useMe } from '../../../api/auth';
import { useDocuments } from '../../../api/documents';
import Constants from 'expo-constants';
import { IconChat, IconFile, IconLanguage, IconLicense, IconLogout, IconPalette, IconPassport, IconPencil, IconQuestion, IconWallet } from '../../../components/icons/LineIcons';
import { Avatar } from '../../../components/ui/Avatar';
import { ListRow } from '../../../components/ui/ListRow';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { StatusPill } from '../../../components/ui/StatusPill';
import { Toggle } from '../../../components/ui/Toggle';
import { useCards } from '../../../api/cards';
import { useWallet } from '../../../api/wallet';
import { useAuthStore } from '../../../stores/authStore';
import { tokens } from '../../../theme/colors';
import { MOCK_USER, getLocaleLabel, getThemeLabel } from '../mockProfile';
import type { MainStackParamList, ProfileStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;
type RootNav = NativeStackNavigationProp<MainStackParamList>;

function statusFromApi(s: 'PENDING' | 'VERIFIED' | 'REJECTED' | undefined): 'pending' | 'verified' | 'rejected' {
  if (s === 'VERIFIED') return 'verified';
  if (s === 'REJECTED') return 'rejected';
  return 'pending';
}

function formatPhone(phone: string): string {
  // +998 99 328-63-30
  if (phone.startsWith('+998') && phone.length === 13) {
    return `${phone.slice(0, 4)} ${phone.slice(4, 6)} ${phone.slice(6, 9)}-${phone.slice(9, 11)}-${phone.slice(11, 13)}`;
  }
  return phone;
}

// Временно скрываем раздел «Финансы» (кошелёк/карты) — запускаем приложение без
// финансов, включим в следующих версиях. Вернуть → поставить true.
const FINANCE_ENABLED = false;

// M2.1 — Главный экран профиля. Спецификация: SOS24_Mobile_Screens.md §M2.1.
export function ProfileScreen() {
  const nav = useNavigation<Nav>();
  const signOut = useAuthStore((s) => s.signOut);
  // Отдел поддержки (M13) живёт на MainStack — открываем через родительский навигатор.
  const openSupport = () => nav.getParent<RootNav>()?.navigate('Support');

  // Версия приложения + git hash сборки (подставляется в app.config.js из git).
  const appVersion = Constants.expoConfig?.version ?? '—';
  const gitHash = (Constants.expoConfig?.extra as { gitHash?: string } | undefined)?.gitHash;
  const appVersionLabel = gitHash ? `Версия ${appVersion} (${gitHash})` : `Версия ${appVersion}`;
  const [notifications, setNotifications] = useState(MOCK_USER.notificationsEnabled);
  const { data: me } = useMe();
  const { data: documents } = useDocuments();
  const { data: wallet } = useWallet();
  const { data: cards } = useCards();
  const passport = documents?.find((d) => d.kind === 'PASSPORT');
  const license = documents?.find((d) => d.kind === 'DRIVER_LICENSE');
  const insets = useSafeAreaInsets();
  const { onScroll, headerAnimatedStyle } = useCollapsingHeader();
  const fullName =
    me && (me.surname || me.name || me.patronymic)
      ? [me.surname, me.name, me.patronymic].filter(Boolean).join(' ')
      : 'Гость';
  const isVerified = me?.verificationStatus === 'MYID_VERIFIED';

  return (
    <PhoneFrame bottomSafeArea={false} topSafeArea={false}>
      <View style={{ flex: 1 }}>
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: insets.top + 64, paddingHorizontal: 24, paddingBottom: 140, gap: 24 }}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
        {/* Profile header */}
        <View style={{ borderRadius: 28, overflow: 'hidden' }}>
          <Glass
            intensity={20}
            tint="light"
            style={{
              backgroundColor: 'rgba(255,255,255,0.55)',
              padding: 22,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              borderWidth: 1,
              borderColor: tokens.hairline,
            }}
          >
            <Avatar name={fullName} size={64} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={{
                  fontFamily: 'NeueMontreal-Medium',
                  fontSize: 20,
                  letterSpacing: -0.1,
                  color: tokens.ink,
                }}
              >
                {fullName}
              </Text>
              <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted }}>
                {me?.phone ? formatPhone(me.phone) : ''}
              </Text>
              {isVerified && (
                <View
                  style={{
                    alignSelf: 'flex-start',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: 'rgba(16,185,129,0.1)',
                    borderRadius: 999,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    marginTop: 2,
                  }}
                >
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' }} />
                  <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: '#059669' }}>
                    MyID верифицирован
                  </Text>
                </View>
              )}
            </View>
            {!isVerified && (
              <Pressable
                onPress={() => nav.navigate('ProfileEdit')}
                style={({ pressed }) => ({
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  backgroundColor: 'rgba(20,20,20,0.05)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <IconPencil size={18} />
              </Pressable>
            )}
          </Glass>
        </View>

        <Section title="Мои документы">
          <ListRow
            icon={<IconPassport />}
            title="Паспорт"
            meta={passport ? `${passport.series} ${passport.number}` : 'не заполнен'}
            trailing={<StatusPill status={statusFromApi(passport?.status)} />}
            onPress={() => nav.navigate('Document', { kind: 'passport' })}
          />
          <ListRow
            icon={<IconLicense />}
            title="Водительское удостоверение"
            meta={license ? `${license.series} ${license.number}` : 'не заполнено'}
            trailing={<StatusPill status={statusFromApi(license?.status)} />}
            onPress={() => nav.navigate('Document', { kind: 'license' })}
          />
        </Section>

        {/* MyID verified personal data — read-only */}
        {isVerified && me && (
          <MyIdDataSection me={me} />
        )}

        {FINANCE_ENABLED && (
          <Section title="Финансы">
            <ListRow
              icon={<IconWallet />}
              title="Кошелёк и карты"
              meta={wallet ? `${wallet.balance.toLocaleString('ru-RU')} сум · ${cards?.length ?? 0} карт` : undefined}
              onPress={() => nav.navigate('Finance')}
            />
          </Section>
        )}

        <Section title="Настройки">
          <ListRow
            icon={<IconLanguage />}
            title="Язык интерфейса"
            value={getLocaleLabel(MOCK_USER.locale)}
            onPress={() => {}}
          />
          <ListRow
            icon={<IconPalette />}
            title="Тема"
            value={getThemeLabel(MOCK_USER.themeMode)}
            onPress={() => {}}
          />
          <ListRow
            icon={<IconChat />}
            title="Уведомления"
            trailing={<Toggle value={notifications} onChange={setNotifications} />}
          />
        </Section>

        <Section title="Помощь">
          <ListRow icon={<IconChat />} title="Поддержка" onPress={openSupport} />
          <ListRow icon={<IconQuestion />} title="Частые вопросы" onPress={openSupport} />
          <ListRow icon={<IconFile />} title="Оферта и политика" onPress={() => {}} />
        </Section>

        <View style={{ marginTop: 4 }}>
          <ListRow
            icon={<IconLogout color={tokens.red} />}
            title="Выйти из аккаунта"
            destructive
            trailing="none"
            onPress={() => void signOut()}
          />
        </View>

        <Text
          style={{
            textAlign: 'center',
            marginTop: 20,
            fontFamily: 'Manrope_400Regular',
            fontSize: 12,
            color: tokens.inkMuted,
          }}
        >
          {appVersionLabel}
        </Text>
        </Animated.ScrollView>

        {/* Fade-overlay сверху: контент мягко исчезает за status bar / DI. */}
        <LinearGradient
          pointerEvents="none"
          colors={[tokens.pageBg, 'rgba(228,228,228,0)']}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, height: insets.top + 24 }}
        />

        {/* Floating-заголовок (large title): тает при скролле вверх, возвращается к началу. */}
        <Animated.View
          style={[
            { position: 'absolute', top: insets.top, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },
            headerAnimatedStyle,
          ]}
        >
          <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 28, letterSpacing: -0.28, color: tokens.ink }}>
            Профиль
          </Text>
        </Animated.View>

        {/* Fade-overlay снизу: контент мягко исчезает над таб-баром. */}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(228,228,228,0)', tokens.pageBg]}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 110 }}
        />
      </View>
    </PhoneFrame>
  );
}

// ─── MyID data read-only section ─────────────────────────────────────────────

type MeData = NonNullable<ReturnType<typeof useMe>['data']>;

function MyIdRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: tokens.hairline }}>
      <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.inkMuted, flex: 1 }}>
        {label}
      </Text>
      <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.inkDark, flex: 1.4, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

function MyIdDataSection({ me }: { me: MeData }) {
  const genderLabel =
    me.gender === '1' || me.gender === 'M' ? 'Мужской'
    : me.gender === '2' || me.gender === 'F' ? 'Женский'
    : me.gender || null;
  const nameEn = [me.surnameEn, me.nameEn].filter((s) => s && s.trim()).join(' ') || null;
  const hasData = me.pinfl || genderLabel || me.birthPlace || me.nationality || me.address || nameEn;

  if (!hasData) return null;

  return (
    <Section title="Личные данные (MyID)">
      <View
        style={{
          backgroundColor: '#fff',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: tokens.hairline,
          paddingHorizontal: 16,
          overflow: 'hidden',
        }}
      >
        <MyIdRow label="ПИНФЛ" value={me.pinfl} />
        <MyIdRow label="Пол" value={genderLabel} />
        <MyIdRow label="Место рождения" value={me.birthPlace} />
        <MyIdRow label="Национальность" value={me.nationality} />
        <MyIdRow label="Гражданство" value={me.citizenship} />
        <MyIdRow label="Адрес прописки" value={me.address} />
        <View style={{ borderBottomWidth: 0 }}>
          <MyIdRow label="Имя (латиница)" value={nameEn} />
        </View>
      </View>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <Text
        style={{
          marginLeft: 4,
          fontFamily: 'Manrope_600SemiBold',
          fontSize: 11,
          color: tokens.inkSubtle,
          letterSpacing: 0.88,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Text>
      <View style={{ gap: 8 }}>{children}</View>
    </View>
  );
}
