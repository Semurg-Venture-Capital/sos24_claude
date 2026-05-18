import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, View } from 'react-native';
import { PageDots } from '../../../components/ui/PageDots';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { TextLink } from '../../../components/ui/TextLink';
import type { AuthStackParamList } from '../../../navigation/types';
import { IllusOnboardingHelp } from '../components/IllusOnboardingHelp';
import { IllusOnboardingPartners } from '../components/IllusOnboardingPartners';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

// M1.2 — три онбординг-слайда. Hero-зона + bottom glass sheet с
// заголовком/описанием/точками/CTA. Эталон: SOS24/screens.jsx → OnboardingFrame.
export function OnboardingScreen() {
  const nav = useNavigation<Nav>();
  const [slide, setSlide] = useState(0);
  const { t } = useTranslation();

  const slides = [
    {
      illus: (
        <View style={{ width: 360, height: 260, alignItems: 'center', justifyContent: 'center' }}>
          <Image
            source={require('../../../../assets/hero-image.png')}
            style={{ width: 360, height: 260 }}
            resizeMode="contain"
          />
        </View>
      ),
      title: t('auth.onboarding.slide1.title'),
      body: t('auth.onboarding.slide1.body'),
    },
    {
      illus: <IllusOnboardingHelp />,
      title: t('auth.onboarding.slide2.title'),
      body: t('auth.onboarding.slide2.body'),
    },
    {
      illus: <IllusOnboardingPartners />,
      title: t('auth.onboarding.slide3.title'),
      body: t('auth.onboarding.slide3.body'),
    },
  ];

  const isLast = slide === slides.length - 1;
  const current = slides[slide];

  const onPrimary = () => {
    if (isLast) nav.navigate('AuthChoose');
    else setSlide(slide + 1);
  };
  const onSkip = () => nav.navigate('AuthChoose');

  return (
    <PhoneFrame>
      {/* Top-right Skip link */}
      {!isLast && (
        <View style={{ position: 'absolute', top: 64, right: 24, zIndex: 4 }}>
          <TextLink onPress={onSkip}>{t('common.skip')}</TextLink>
        </View>
      )}

      {/* Hero illustration */}
      <View
        style={{
          position: 'absolute',
          top: 130,
          left: 0,
          right: 0,
          height: 320,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {current.illus}
      </View>

      {/* Bottom glass sheet */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 320,
          borderTopLeftRadius: 48,
          borderTopRightRadius: 48,
          overflow: 'hidden',
        }}
      >
        <BlurView
          intensity={40}
          tint="light"
          style={{
            flex: 1,
            backgroundColor: 'rgba(255,255,255,0.55)',
            padding: 32,
            paddingTop: 32,
            paddingBottom: 32,
            gap: 24,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <PageDots count={slides.length} active={slide} />
          </View>
          <ScreenHeading title={current.title} subtitle={current.body} />
          <RedButton onPress={onPrimary} style={{ alignSelf: 'stretch' }}>
            {isLast ? t('common.start') : t('common.next')}
          </RedButton>
        </BlurView>
      </View>
    </PhoneFrame>
  );
}
