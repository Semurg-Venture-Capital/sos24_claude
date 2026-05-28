import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import { Animated, Linking, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { OutlineButton } from '../../../components/ui/OutlineButton';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { tokens } from '../../../theme/colors';
import type { AdjusterStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<AdjusterStackParamList, 'AdjusterSent'>;

const DISPATCHER_PHONE = '+998712345600';

export function AdjusterSentScreen() {
  const nav = useNavigation<Nav>();

  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, damping: 14, stiffness: 180, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const route = useRoute<RouteProp<AdjusterStackParamList, 'AdjusterSent'>>();
  const { requestId } = route.params;

  const handleCall = () => {
    void Linking.openURL(`tel:${DISPATCHER_PHONE}`);
  };

  const handleStatus = () => {
    nav.replace('AdjusterStatus', { requestId });
  };

  const handleHome = () => {
    nav.getParent()?.goBack();
  };

  return (
    <PhoneFrame>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 0 }}>
        {/* Icon */}
        <Animated.View style={{ transform: [{ scale }], opacity, marginBottom: 32 }}>
          <View style={{
            width: 100, height: 100, borderRadius: 999,
            backgroundColor: 'rgba(52,211,153,0.12)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <View style={{
              width: 72, height: 72, borderRadius: 999,
              backgroundColor: 'rgba(52,211,153,0.2)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={tokens.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <Path d="M22 4L12 14.01l-3-3" />
              </Svg>
            </View>
          </View>
        </Animated.View>

        {/* Text */}
        <Animated.View style={{ opacity, alignItems: 'center', gap: 12 }}>
          <Text style={{
            fontFamily: 'NeueMontreal-Medium',
            fontSize: 28,
            letterSpacing: -0.28,
            color: tokens.ink,
            textAlign: 'center',
            lineHeight: 32,
          }}>
            Заявка принята
          </Text>
          <Text style={{
            fontFamily: 'Manrope_400Regular',
            fontSize: 15,
            color: tokens.inkMuted,
            textAlign: 'center',
            lineHeight: 22,
          }}>
            Аджастер уже едет к вам.{'\n'}Среднее время прибытия — 25–40 минут.
          </Text>

          {/* Dispatcher info */}
          <View style={{
            marginTop: 16,
            backgroundColor: 'rgba(255,255,255,0.7)',
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: tokens.hairline,
            padding: 18,
            alignItems: 'center',
            gap: 6,
            width: '100%',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{
                width: 32, height: 32, borderRadius: 999,
                backgroundColor: tokens.inkDark,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.7A2 2 0 012.18 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l.56-.56a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </Svg>
              </View>
              <View>
                <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.ink }}>
                  Диспетчер SOS24
                </Text>
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>
                  Работает 24/7
                </Text>
              </View>
            </View>
            <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 20, color: tokens.ink, letterSpacing: 0.5 }}>
              {DISPATCHER_PHONE}
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Buttons */}
      <View style={{ padding: 24, paddingTop: 0, gap: 10 }}>
        <RedButton trailing={false} onPress={handleStatus}>
          Отследить статус
        </RedButton>
        <OutlineButton style={{ height: 52 }} onPress={handleCall}>
          Позвонить диспетчеру
        </OutlineButton>
        <OutlineButton style={{ height: 52 }} onPress={handleHome}>
          На главную
        </OutlineButton>
      </View>
    </PhoneFrame>
  );
}
