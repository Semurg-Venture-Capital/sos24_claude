import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LiquidGlassNativeView } from '@sos24/liquid-glass';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, PanResponder, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabIconCar, TabIconHome, TabIconShield, TabIconUser } from '../icons/TabIcons';
import { tokens } from '../../theme/colors';

// Кастомный нижний бар «Liquid Glass» для Android (порт kyant LiquidBottomTabs).
// Стеклянная капсула + индикатор-«капелька» — тоже нативное стекло, перетекает к
// активной вкладке (тап/свайп) с velocity-squish. На iOS — нативный таб-бар (не этот).

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

// Общий id: сцена (LiquidGlassBackdropView) ↔ стёкла бара/индикатора.
export const LIQUID_BACKDROP_ID = 1;

const H_MARGIN = 14;
const BAR_HEIGHT = 64;
const PILL_INSET = 5;

export function LiquidGlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const n = state.routes.length;
  const barWidth = width - H_MARGIN * 2;
  const tabWidth = barWidth / n;

  const dropX = useRef(new Animated.Value(state.index * tabWidth)).current;
  const sx = useRef(new Animated.Value(1)).current; // горизонтальное растяжение (velocity-squish)
  const sy = useRef(new Animated.Value(1)).current; // вертикальное сжатие
  const indexRef = useRef(state.index);
  indexRef.current = state.index;

  const navigate = (i: number) => {
    const route = state.routes[i];
    const focused = state.index === i;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
  };

  const settle = () => {
    Animated.spring(sx, { toValue: 1, useNativeDriver: false, friction: 5, tension: 120 }).start();
    Animated.spring(sy, { toValue: 1, useNativeDriver: false, friction: 5, tension: 120 }).start();
  };

  // Перетекание к активной вкладке + лёгкое «жидкое» сжатие.
  useEffect(() => {
    Animated.parallel([
      Animated.spring(dropX, { toValue: state.index * tabWidth, useNativeDriver: false, friction: 7, tension: 80 }),
      Animated.sequence([
        Animated.timing(sx, { toValue: 0.82, duration: 110, useNativeDriver: false }),
        Animated.spring(sx, { toValue: 1, useNativeDriver: false, friction: 4, tension: 120 }),
      ]),
    ]).start();
  }, [state.index, tabWidth, dropX, sx]);

  // Свайп: тянем индикатор пальцем + растяжение по скорости; на отпускании — ближайшая вкладка.
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderGrant: () => dropX.stopAnimation(),
        onPanResponderMove: (_e, g) => {
          const base = indexRef.current * tabWidth;
          dropX.setValue(Math.max(0, Math.min((n - 1) * tabWidth, base + g.dx)));
          // velocity-squish: чем быстрее — тем сильнее растяжение по горизонтали и сжатие по вертикали
          const v = Math.abs(g.vx);
          sx.setValue(1 + Math.min(0.22, v * 0.09));
          sy.setValue(1 - Math.min(0.14, v * 0.06));
        },
        onPanResponderRelease: (_e, g) => {
          const target = Math.max(0, Math.min(n - 1, Math.round((indexRef.current * tabWidth + g.dx) / tabWidth)));
          Animated.spring(dropX, { toValue: target * tabWidth, useNativeDriver: false, friction: 7, tension: 80 }).start();
          settle();
          if (target !== indexRef.current) navigate(target);
        },
        onPanResponderTerminate: settle,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tabWidth, n],
  );

  const capsule = BAR_HEIGHT / 2;
  const pillW = tabWidth - PILL_INSET * 2;
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
        {/* Слой 1: стекло капсулы (порт kyant). */}
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
        {/* Слой 2: молочный тинт (kyant containerColor #FAFAFA @ 40%). */}
        <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(250,250,250,0.4)' }]} />

        {/* Слой 3: индикатор-«капелька» — тоже нативное стекло + красный тинт. */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: PILL_INSET,
            top: PILL_INSET,
            width: pillW,
            height: pillH,
            borderRadius: pillH / 2,
            overflow: 'hidden',
            transform: [{ translateX: dropX }, { scaleX: sx }, { scaleY: sy }],
          }}
        >
          <LiquidGlassNativeView
            pointerEvents="none"
            backdropId={LIQUID_BACKDROP_ID}
            cornerRadius={pillH / 2}
            refractionHeight={14}
            refractionAmount={16}
            blurRadius={3}
            highlightOpacity={0.7}
            highlightAngle={-90}
            highlightFalloff={2}
            style={StyleSheet.absoluteFillObject}
          />
          <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(230,20,40,0.12)' }]} />
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, { borderRadius: pillH / 2, borderWidth: 1, borderColor: 'rgba(230,20,40,0.2)' }]}
          />
        </Animated.View>

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
