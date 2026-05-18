import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SosLogo } from '../../../components/ui/SosLogo';
import { OutlineButton } from '../../../components/ui/OutlineButton';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { tokens } from '../../../theme/colors';
import type { AuthStackParamList } from '../../../navigation/types';
import { IllusAuthHand } from '../components/IllusAuthHand';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

// M1.3 — выбор Войти / Зарегистрироваться. Эталон: SOS24/screens.jsx → ScreenAuthChoose.
export function AuthChooseScreen() {
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();

  return (
    <PhoneFrame>
      {/* Logo top */}
      <View style={{ position: 'absolute', top: 120, left: 0, right: 0, alignItems: 'center' }}>
        <SosLogo size="lg" />
      </View>

      {/* Heading block */}
      <View style={{ position: 'absolute', top: 220, left: 24, right: 24, alignItems: 'center' }}>
        <Text
          style={{
            fontFamily: 'NeueMontreal-Medium',
            fontSize: 30,
            letterSpacing: -0.3,
            color: tokens.ink,
          }}
        >
          {t('auth.authChoose.title')}
        </Text>
        <Text
          style={{
            marginTop: 10,
            fontFamily: 'Manrope_400Regular',
            fontSize: 16,
            color: tokens.inkMuted,
            letterSpacing: -0.08,
            textAlign: 'center',
          }}
        >
          {t('auth.authChoose.subtitle')}
        </Text>
      </View>

      {/* Illustration */}
      <View style={{ position: 'absolute', top: 340, left: 0, right: 0, alignItems: 'center' }}>
        <IllusAuthHand />
      </View>

      {/* Buttons */}
      <View style={{ position: 'absolute', left: 24, right: 24, bottom: 64, gap: 10 }}>
        <RedButton onPress={() => nav.navigate('Phone', { mode: 'signIn' })}>
          {t('auth.authChoose.signIn')}
        </RedButton>
        <OutlineButton onPress={() => nav.navigate('Phone', { mode: 'signUp' })}>
          {t('auth.authChoose.signUp')}
        </OutlineButton>
        <Text
          style={{
            marginTop: 12,
            marginHorizontal: 4,
            fontFamily: 'Manrope_400Regular',
            fontSize: 12,
            color: tokens.inkMuted,
            lineHeight: 17,
            textAlign: 'center',
          }}
        >
          {t('auth.authChoose.terms')}
        </Text>
      </View>
    </PhoneFrame>
  );
}
