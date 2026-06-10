import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LiquidGlassNativeView } from '@sos24/liquid-glass';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, PanResponder, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabIconCar, TabIconHome, TabIconShield, TabIconUser } from '../icons/TabIcons';
import { tokens } from '../../theme/colors';

// Кастомный нижний бар «Liquid Glass» для Android (порт kyant LiquidBottomTabs).
// Стеклянная капсула + индикатор-«капелька», который перетекает к активной вкладке
// (тап) и тянется пальцем (свайп). На iOS используется нативный таб-бар (не этот).

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
const BAR_HEIGHT = 64;
const PILL_INSET = 5; // отступ индикатора внутри бара

export function LiquidGlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const n = state.routes.length;
  const barWidth = width - H_MARGIN * 2;
  const tabWidth = barWidth / n;

  // Позиция индикатора = левый край активной вкладки.
  const dropX = useRef(new Animated.Value(state.index * tabWidth)).current;
  const scaleX = useRef(new Animated.Value(1)).current;
  const indexRef = useRef(state.index);
  indexRef.current = state.index;

  const navigate = (i: number) => {
    const route = state.routes[i];
    const focused = state.index === i;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
  };

  // Пружинное перетекание к активной вкладке + «жидкое» сжатие.
  useEffect(() => {
    Animated.parallel([
      Animated.spring(dropX, { toValue: state.index * tabWidth, useNativeDriver: false, friction: 7, tension: 80 }),
      Animated.sequence([
        Animated.timing(scaleX, { toValue: 0.8, duration: 110, useNativeDriver: false }),
        Animated.spring(scaleX, { toValue: 1, useNativeDriver: false, friction: 4, tension: 120 }),
      ]),
    ]).start();
  }, [state.index, tabWidth, dropX, scaleX]);

  // Свайп: тянем индикатор пальцем, на отпускании — ближайшая вкладка.
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderGrant: () => {
          dropX.stopAnimation();
        },
        onPanResponderMove: (_e, g) => {
          const base = indexRef.current * tabWidth;
          const x = Math.max(0, Math.min((n - 1) * tabWidth, base + g.dx));
          dropX.setValue(x);
        },
        onPanResponderRelease: (_e, g) => {
          const base = indexRef.current * tabWidth;
          const x = base + g.dx;
          const target = Math.max(0, Math.min(n - 1, Math.round(x / tabWidth)));
          Animated.spring(dropX, { toValue: target * tabWidth, useNativeDriver: false, friction: 7, tension: 80 }).start();
          if (target !== indexRef.current) navigate(target);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tabWidth, n],
  );

  const capsule = BAR_HEIGHT / 2;
  const pillH = BAR_HEIGHT - PILL_INSET * 2;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: H_MARGIN, right: H_MARGIN, bottom: insets.bottom + 6 }}
    >
      <View
        {...pan.panHandlers}
        style={{
          height: BAR_HEIGHT,
          borderRadius: capsule,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
        }}
      >
        {/* Слой 1: стекло (порт kyant — AGSL refraction фона). Не перехватывает касания. */}
        <LiquidGlassNativeView
          pointerEvents="none"
          backdropId={LIQUID_BACKDROP_ID}
          cornerRadius={capsule}
          refractionHeight={24}
          refractionAmount={24}
          blurRadius={8}
          highlightOpacity={0.6}
          highlightAngle={-90}
          highlightFalloff={2}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Слой 2: молочный тинт стекла (kyant containerColor #FAFAFA @ 40%). */}
        <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(250,250,250,0.4)' }]} />

        {/* Слой 3: индикатор-«капелька» (во всю ширину вкладки, перетекает). */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: PILL_INSET,
            top: PILL_INSET,
            width: tabWidth - PILL_INSET * 2,
            height: pillH,
            borderRadius: pillH / 2,
            backgroundColor: 'rgba(230,20,40,0.12)',
            borderWidth: 1,
            borderColor: 'rgba(230,20,40,0.18)',
            transform: [{ translateX: dropX }, { scaleX }],
          }}
        />

        {/* Слой 4: иконки и лейблы (поверх стекла, кликабельны). */}
        <View pointerEvents="box-none" style={{ flexDirection: 'row', alignItems: 'center', height: BAR_HEIGHT }}>
          {state.routes.map((route, i) => {
            const focused = state.index === i;
            const Icon = ICONS[route.name];
            const label = LABELS[route.name] ?? route.name;
            const color = focused ? tokens.red : tokens.inkMuted;
            return (
              <Pressable
                key={route.key}
                onPress={() => navigate(i)}
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
