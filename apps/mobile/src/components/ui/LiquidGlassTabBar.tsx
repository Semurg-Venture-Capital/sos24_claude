import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LiquidGlassNativeView } from '@sos24/liquid-glass';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabIconCar, TabIconHome, TabIconShield, TabIconUser } from '../icons/TabIcons';
import { tokens } from '../../theme/colors';

// Кастомный нижний бар «Liquid Glass» для Android (аналог iOS 26).
// Плавающая стеклянная пилюля + «капелька» — жидкая подсветка, пружинисто
// перетекающая к активной вкладке. На iOS используется нативный таб-бар (не этот).

const ICONS: Record<string, (p: { size?: number; color?: string; active?: boolean }) => React.ReactElement> = {
  Home: TabIconHome,
  Policies: TabIconShield,
  Garage: TabIconCar,
  Profile: TabIconUser,
};
const LABELS: Record<string, string> = {
  Home: 'Главная',
  Policies: 'Полисы',
  Garage: 'Гараж',
  Profile: 'Профиль',
};

// Общий id: сцена (LiquidGlassBackdropView) ↔ бар (LiquidGlassNativeView).
export const LIQUID_BACKDROP_ID = 1;

const H_MARGIN = 14;
const BAR_HEIGHT = 66;
const DROP_W = 56;
const DROP_H = 46;

export function LiquidGlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const barWidth = width - H_MARGIN * 2;
  const tabWidth = barWidth / state.routes.length;

  // Позиция «капельки» = центр активной вкладки.
  const dropX = useRef(new Animated.Value(state.index * tabWidth + tabWidth / 2)).current;
  const squish = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const target = state.index * tabWidth + tabWidth / 2;
    Animated.parallel([
      // пружина с лёгким перелётом → «жидкое» перетекание
      Animated.spring(dropX, { toValue: target, useNativeDriver: true, friction: 7, tension: 90 }),
      // сжатие-разжатие на приземлении → ощущение капли
      Animated.sequence([
        Animated.timing(squish, { toValue: 0.78, duration: 100, useNativeDriver: true }),
        Animated.spring(squish, { toValue: 1, useNativeDriver: true, friction: 4, tension: 120 }),
      ]),
    ]).start();
  }, [state.index, tabWidth, dropX, squish]);

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: H_MARGIN, right: H_MARGIN, bottom: insets.bottom + 6 }}
    >
      <View
        style={{
          height: BAR_HEIGHT,
          borderRadius: 30,
          overflow: 'hidden',
          // мягкая тень под плавающей пилюлей
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
        }}
      >
        {/* Слой 1: настоящее стекло (порт kyant — AGSL refraction фона под баром) */}
        <LiquidGlassNativeView
          backdropId={LIQUID_BACKDROP_ID}
          cornerRadius={30}
          refractionHeight={22}
          refractionAmount={26}
          blurRadius={5}
          highlightOpacity={0.5}
          highlightAngle={-45}
          highlightFalloff={3}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Слой 2: «капелька» — жидкая подсветка под активной вкладкой (над стеклом) */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: DROP_W,
            height: DROP_H,
            left: -DROP_W / 2,
            top: (BAR_HEIGHT - DROP_H) / 2,
            borderRadius: 22,
            backgroundColor: 'rgba(230,20,40,0.14)',
            borderWidth: 1,
            borderColor: 'rgba(230,20,40,0.22)',
            transform: [{ translateX: dropX }, { scaleX: squish }],
          }}
        />

        {/* Слой 3: иконки и лейблы (поверх стекла) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', height: BAR_HEIGHT }}>
          {state.routes.map((route, i) => {
            const focused = state.index === i;
            const Icon = ICONS[route.name];
            const label = LABELS[route.name] ?? route.name;
            const color = focused ? tokens.red : tokens.inkMuted;

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                android_ripple={{ color: 'rgba(0,0,0,0.04)', borderless: true, radius: 36 }}
                style={{ flex: 1, height: BAR_HEIGHT, alignItems: 'center', justifyContent: 'center', gap: 4 }}
              >
                {Icon ? <Icon size={23} color={color} active={focused} /> : null}
                <Text
                  style={{
                    fontFamily: focused ? 'Manrope_600SemiBold' : 'Manrope_500Medium',
                    fontSize: 10.5,
                    letterSpacing: 0.1,
                    color,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
