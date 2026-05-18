import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SosMark } from '../../../components/icons/SosMark';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { tokens } from '../../../theme/colors';

// M1.1 — Splash. Эталон: SOS24/screens.jsx → ScreenSplash.
// Бренд по центру (логотип + wordmark), мягкий красный halo, под ним слоган,
// внизу — тонкий progress-бар.
export function SplashScreen() {
  const { t } = useTranslation();
  const pulse = useRef(new Animated.Value(1)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
    Animated.timing(progress, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }).start();
  }, [pulse, progress]);

  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <PhoneFrame>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {/* Red halo */}
        <View
          style={{
            position: 'absolute',
            width: 360,
            height: 360,
            borderRadius: 999,
            backgroundColor: 'rgba(230,20,40,0.10)',
            opacity: 0.6,
          }}
        />
        {/* Logo lockup, large */}
        <Animated.View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            transform: [{ scale: pulse }],
          }}
        >
          <SosMark size={56} />
          <Text
            style={{
              fontFamily: 'NeueMontreal-Bold',
              fontSize: 52,
              color: tokens.ink,
              letterSpacing: -1.56,
              lineHeight: 56,
            }}
          >
            SOS
          </Text>
          <Text
            style={{
              fontFamily: 'NeueMontreal-Medium',
              fontSize: 24,
              color: tokens.ink,
              lineHeight: 24,
              alignSelf: 'flex-end',
              paddingBottom: 4,
            }}
          >
            24
          </Text>
        </Animated.View>
        <Text
          style={{
            marginTop: 18,
            fontFamily: 'Manrope_400Regular',
            fontSize: 16,
            color: tokens.inkMuted,
            letterSpacing: -0.08,
          }}
        >
          {t('auth.splash.tagline')}
        </Text>
      </View>

      {/* Bottom loading bar */}
      <View
        style={{
          position: 'absolute',
          left: 24,
          right: 24,
          bottom: 80,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 140,
            height: 3,
            borderRadius: 999,
            backgroundColor: 'rgba(20,20,20,0.08)',
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={{
              height: '100%',
              width: progressWidth,
              borderRadius: 999,
              backgroundColor: tokens.red,
            }}
          />
        </View>
      </View>
    </PhoneFrame>
  );
}
