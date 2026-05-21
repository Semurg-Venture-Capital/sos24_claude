import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useMe } from '../../../api/auth';
import { useDocuments } from '../../../api/documents';
import { IconChat, IconFile, IconInfo, IconLanguage, IconLicense, IconLogout, IconPalette, IconPassport, IconPencil, IconQuestion } from '../../../components/icons/LineIcons';
import { Avatar } from '../../../components/ui/Avatar';
import { ListRow } from '../../../components/ui/ListRow';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { StatusPill } from '../../../components/ui/StatusPill';
import { Toggle } from '../../../components/ui/Toggle';
import { useAuthStore } from '../../../stores/authStore';
import { tokens } from '../../../theme/colors';
import { MOCK_USER, getLocaleLabel, getThemeLabel } from '../mockProfile';
import type { ProfileStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

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

// M2.1 — Главный экран профиля. Спецификация: SOS24_Mobile_Screens.md §M2.1.
export function ProfileScreen() {
  const nav = useNavigation<Nav>();
  const signOut = useAuthStore((s) => s.signOut);
  const [notifications, setNotifications] = useState(MOCK_USER.notificationsEnabled);
  const { data: me } = useMe();
  const { data: documents } = useDocuments();
  const passport = documents?.find((d) => d.kind === 'PASSPORT');
  const license = documents?.find((d) => d.kind === 'DRIVER_LICENSE');
  const fullName =
    me && (me.surname || me.name || me.patronymic)
      ? [me.surname, me.name, me.patronymic].filter(Boolean).join(' ')
      : 'Гость';
  const isVerified = me?.verificationStatus === 'MYID_VERIFIED';

  return (
    <PhoneFrame>
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 }}>
        <Text
          style={{
            fontFamily: 'NeueMontreal-Medium',
            fontSize: 28,
            letterSpacing: -0.28,
            color: tokens.ink,
          }}
        >
          Профиль
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <View style={{ borderRadius: 28, overflow: 'hidden' }}>
          <BlurView
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
          </BlurView>
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
          <ListRow icon={<IconChat />} title="Поддержка" onPress={() => {}} />
          <ListRow icon={<IconQuestion />} title="Частые вопросы" onPress={() => {}} />
          <ListRow icon={<IconInfo />} title="О приложении" value="0.1.0" onPress={() => {}} />
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
      </ScrollView>
    </PhoneFrame>
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
