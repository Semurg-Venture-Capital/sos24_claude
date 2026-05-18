import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import {
  GlassContainer,
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { type LayoutChangeEvent, PanResponder, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { TabIconCar, TabIconHome, TabIconShield, TabIconUser } from '../icons/TabIcons';
import { tokens } from '../../theme/colors';

const ICONS: Record<string, (active: boolean) => ReactNode> = {
  Home: (active) => <TabIconHome active={active} color={active ? tokens.inkDark : 'rgba(20,20,20,0.32)'} />,
  Policies: (active) => <TabIconShield active={active} color={active ? tokens.inkDark : 'rgba(20,20,20,0.32)'} />,
  Garage: (active) => <TabIconCar active={active} color={active ? tokens.inkDark : 'rgba(20,20,20,0.32)'} />,
  Profile: (active) => <TabIconUser active={active} color={active ? tokens.inkDark : 'rgba(20,20,20,0.32)'} />,
};

// Двойная проверка: isLiquidGlassAvailable проверяет билд (Info.plist + SDK),
// isGlassEffectAPIAvailable — runtime (некоторые iOS 26 beta могут крашить
// без этой проверки). Берём оба для безопасности.
const USE_LIQUID_GLASS = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

// AnimatedGlassView — обёртка для Reanimated (не классического Animated).
// Reanimated правильно прокидывает animated props в native-компонент GlassView.
const AnimatedGlassView = Animated.createAnimatedComponent(GlassView);

const HORIZONTAL_PADDING = 6;
const GAP = 4;
const POP_SIZE = 56;
const BAR_HEIGHT = 68;

// Bottom tab bar.
// ───────────────────────────────────────────────────────────
// Liquid Glass путь (iOS 26+, App Store / Telegram-style):
//   GlassContainer spacing={N} оборачивает 2 GlassView:
//   • большой bar — фон-капсула (всегда виден)
//   • маленький pop — кружок над активным табом (анимированный translate)
//   Когда они сходятся в пределах spacing, мерджатся в единую жидкую форму —
//   получается «вытягивание» бара вверх под кружком (та самая лупа).
//
// Fallback путь (Android / iOS<26 / web): простой BlurView + per-tab popup.
// ───────────────────────────────────────────────────────────
export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const [barWidth, setBarWidth] = useState(0);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const numTabs = state.routes.length;

  const xToIndex = useCallback(
    (x: number) => {
      if (barWidth <= 0) return -1;
      return Math.min(numTabs - 1, Math.max(0, Math.floor((x / barWidth) * numTabs)));
    },
    [barWidth, numTabs],
  );

  const commit = useCallback(
    (x: number) => {
      const idx = xToIndex(x);
      setPreviewIndex(null);
      if (idx >= 0 && idx !== state.index) {
        const target = state.routes[idx];
        if (target) navigation.navigate(target.name);
      }
    },
    [xToIndex, navigation, state.index, state.routes],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          const idx = xToIndex(e.nativeEvent.locationX);
          if (idx >= 0) setPreviewIndex(idx);
        },
        onPanResponderMove: (e) => {
          const idx = xToIndex(e.nativeEvent.locationX);
          if (idx >= 0) setPreviewIndex(idx);
        },
        onPanResponderRelease: (e) => commit(e.nativeEvent.locationX),
        onPanResponderTerminate: () => setPreviewIndex(null),
      }),
    [xToIndex, commit],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  };

  return (
    <View
      onLayout={onLayout}
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        left: 22,
        right: 22,
        bottom: 22,
        height: BAR_HEIGHT,
        shadowColor: 'rgb(201,201,201)',
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.55,
        shadowRadius: 40,
        elevation: 12,
      }}
    >
      {USE_LIQUID_GLASS ? (
        <LiquidGlassBar
          routes={state.routes}
          activeIndex={state.index}
          previewIndex={previewIndex}
          barWidth={barWidth}
          numTabs={numTabs}
        />
      ) : (
        <FallbackBar
          routes={state.routes}
          activeIndex={state.index}
          previewIndex={previewIndex}
        />
      )}
    </View>
  );
}

interface BarProps {
  routes: BottomTabBarProps['state']['routes'];
  activeIndex: number;
  previewIndex: number | null;
  barWidth: number;
  numTabs: number;
}

// ── Liquid Glass ────────────────────────────────────────────────────────
// Два GlassView внутри одного GlassContainer:
//   1. Большой bar — статичная капсула на всю ширину
//   2. Маленький pop — кружок, анимированный transform'ом translateX/Y
// Когда pop сближается с bar (translateY → -8), merge через spacing
// создаёт «жидкое вытягивание» — лупа.
// До preview pop спрятан translateY: 80 (под баром) → spacing не задевает.
function LiquidGlassBar({ routes, activeIndex, previewIndex, barWidth, numTabs }: BarProps) {
  const popX = useSharedValue(0);
  const popY = useSharedValue(80); // изначально спрятан под баром

  // Центры табов в координатах бара (для позиционирования pop'а)
  const tabCenters = useMemo(() => {
    if (barWidth <= 0) return [];
    const availWidth = barWidth - 2 * HORIZONTAL_PADDING - (numTabs - 1) * GAP;
    const tabWidth = availWidth / numTabs;
    return Array.from(
      { length: numTabs },
      (_, i) => HORIZONTAL_PADDING + i * (tabWidth + GAP) + tabWidth / 2,
    );
  }, [barWidth, numTabs]);

  useEffect(() => {
    if (previewIndex !== null && tabCenters[previewIndex] !== undefined) {
      const targetX = tabCenters[previewIndex] - POP_SIZE / 2;
      popX.value = withSpring(targetX, { damping: 14, stiffness: 220, mass: 0.8 });
      popY.value = withSpring(-8, { damping: 14, stiffness: 220, mass: 0.8 });
    } else {
      popY.value = withSpring(80, { damping: 18, stiffness: 200 });
    }
  }, [previewIndex, tabCenters, popX, popY]);

  const popAnimatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: POP_SIZE,
    height: POP_SIZE,
    borderRadius: POP_SIZE / 2,
    top: 0,
    left: 0,
    transform: [{ translateX: popX.value }, { translateY: popY.value }],
  }));

  return (
    <>
      <GlassContainer
        spacing={24}
        style={{
          flex: 1,
          position: 'relative',
        }}
      >
        {/* Background bar — capsule */}
        <GlassView
          glassEffectStyle="regular"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: BAR_HEIGHT / 2,
          }}
        />

        {/* Pop — маленький glass-кружок, мерджится с bar при сближении */}
        <AnimatedGlassView
          glassEffectStyle="regular"
          isInteractive
          style={popAnimatedStyle}
        />
      </GlassContainer>

      {/* Icons overlay */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: HORIZONTAL_PADDING,
          paddingVertical: 6,
          gap: GAP,
        }}
      >
        {routes.map((route, i) => (
          <View
            key={route.key}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            {ICONS[route.name]?.(activeIndex === i)}
          </View>
        ))}
      </View>
    </>
  );
}

// ── Fallback (BlurView, без morph) ──────────────────────────────────────
function FallbackBar({ routes, activeIndex, previewIndex }: Omit<BarProps, 'barWidth' | 'numTabs'>) {
  return (
    <>
      {/* Background blur capsule */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 999,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.5)',
        }}
      >
        <BlurView
          intensity={32}
          tint="light"
          style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.5)' }}
        />
      </View>

      {/* Tabs with white pop pill */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: HORIZONTAL_PADDING,
          paddingVertical: 6,
          gap: GAP,
        }}
      >
        {routes.map((route, i) => (
          <FallbackTabItem
            key={route.key}
            routeName={route.name}
            active={activeIndex === i}
            preview={previewIndex === i}
          />
        ))}
      </View>
    </>
  );
}

interface FallbackTabItemProps {
  routeName: string;
  active: boolean;
  preview: boolean;
}

function FallbackTabItem({ routeName, active, preview }: FallbackTabItemProps) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const bgOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(preview ? 1.18 : 1, { damping: 12, stiffness: 200 });
    translateY.value = withSpring(preview ? -6 : 0, { damping: 12, stiffness: 200 });
    bgOpacity.value = withTiming(preview ? 1 : 0, { duration: 160 });
  }, [preview, scale, translateY, bgOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          flex: 1,
          height: 56,
          alignItems: 'center',
          justifyContent: 'center',
        },
        animatedStyle,
      ]}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 999,
            backgroundColor: '#ffffff',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.18,
            shadowRadius: 10,
            elevation: 4,
          },
          bgStyle,
        ]}
      />
      {ICONS[routeName]?.(active)}
    </Animated.View>
  );
}
