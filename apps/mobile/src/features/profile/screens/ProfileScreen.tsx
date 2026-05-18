import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { IconChat, IconFile, IconInfo, IconLanguage, IconLicense, IconLogout, IconPalette, IconPassport, IconPencil, IconQuestion } from '../../../components/icons/LineIcons';
import { Avatar } from '../../../components/ui/Avatar';
import { ListRow } from '../../../components/ui/ListRow';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { StatusPill } from '../../../components/ui/StatusPill';
import { Toggle } from '../../../components/ui/Toggle';
import { useAuthStore } from '../../../stores/authStore';
import { tokens } from '../../../theme/colors';
import { MOCK_DOCUMENTS, MOCK_USER, getLocaleLabel, getThemeLabel } from '../mockProfile';
import type { ProfileStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

// M2.1 — Главный экран профиля. Спецификация: SOS24_Mobile_Screens.md §M2.1.
export function ProfileScreen() {
  const nav = useNavigation<Nav>();
  const signOut = useAuthStore((s) => s.signOut);
  const [notifications, setNotifications] = useState(MOCK_USER.notificationsEnabled);

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
            <Avatar name={MOCK_USER.fullName} size={64} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={{
                  fontFamily: 'NeueMontreal-Medium',
                  fontSize: 20,
                  letterSpacing: -0.1,
                  color: tokens.ink,
                }}
              >
                {MOCK_USER.fullName}
              </Text>
              <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted }}>
                {MOCK_USER.prettyPhone}
              </Text>
            </View>
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
          </BlurView>
        </View>

        <Section title="Мои документы">
          <ListRow
            icon={<IconPassport />}
            title={MOCK_DOCUMENTS.passport.title}
            meta={
              MOCK_DOCUMENTS.passport.series && MOCK_DOCUMENTS.passport.number
                ? `${MOCK_DOCUMENTS.passport.series} ${MOCK_DOCUMENTS.passport.number}`
                : undefined
            }
            trailing={<StatusPill status={MOCK_DOCUMENTS.passport.status} />}
            onPress={() => nav.navigate('Document', { kind: 'passport' })}
          />
          <ListRow
            icon={<IconLicense />}
            title={MOCK_DOCUMENTS.license.title}
            meta={
              MOCK_DOCUMENTS.license.series && MOCK_DOCUMENTS.license.number
                ? `${MOCK_DOCUMENTS.license.series} ${MOCK_DOCUMENTS.license.number}`
                : undefined
            }
            trailing={<StatusPill status={MOCK_DOCUMENTS.license.status} />}
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
