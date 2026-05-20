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

let USE_LIQUID_GLASS = false;
try {
  USE_LIQUID_GLASS = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
} catch {
  USE_LIQUID_GLASS = false;
}

// AnimatedGlassView через Reanimated (createAnimatedComponent) — нужно чтобы
// transform.scale работал на native GlassView. Reanimated 4 (babel-плагин
// react-native-worklets/plugin).
const AnimatedGlassView = Animated.createAnimatedComponent(GlassView);

const HORIZONTAL_PADDING = 6;
const GAP = 4;
const BAR_HEIGHT = 68;
const TAB_HEIGHT = 56;
const PREVIEW_SCALE = 1.16;

// Bottom tab bar.
// ───────────────────────────────────────────────────────────
// Liquid Glass путь (iOS 26+):
//   GlassContainer (flex-layout, как в доке expo-glass-effect) содержит N
//   GlassView — по одному на таб, каждый с фиксированной шириной.
//   spacing мерджит соседей в единую жидкую форму → визуально цельный бар.
//   При preview таб scale'ится → бар «вытягивается» вокруг него (morph-лупа).
//
// Fallback (Android / iOS<26 / web): BlurView капсула + per-tab pop-пилюля.
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

  // Ширина одного таба внутри GlassContainer (flex-layout требует явные размеры).
  const tabWidth =
    barWidth > 0
      ? (barWidth - 2 * HORIZONTAL_PADDING - (numTabs - 1) * GAP) / numTabs
      : 0;

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
      {USE_LIQUID_GLASS && tabWidth > 0 ? (
        <LiquidGlassBar
          routes={state.routes}
          activeIndex={state.index}
          previewIndex={previewIndex}
          tabWidth={tabWidth}
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

interface LiquidBarProps {
  routes: BottomTabBarProps['state']['routes'];
  activeIndex: number;
  previewIndex: number | null;
  tabWidth: number;
}

// ── Liquid Glass: N glass-табов в одном GlassContainer (flex row, sized children).
function LiquidGlassBar({ routes, activeIndex, previewIndex, tabWidth }: LiquidBarProps) {
  return (
    <>
      <GlassContainer
        spacing={16}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: HORIZONTAL_PADDING,
          gap: GAP,
        }}
      >
        {routes.map((route, i) => (
          <GlassTab key={route.key} width={tabWidth} preview={previewIndex === i} />
        ))}
      </GlassContainer>

      {/* Иконки — overlay поверх стекла, та же flex-разметка. */}
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
          gap: GAP,
        }}
      >
        {routes.map((route, i) => (
          <IconSlot
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

// Один glass-таб. При preview scale'ится — GlassContainer пере-мерджит соседей,
// бар «вытягивается» вокруг увеличенного таба.
function GlassTab({ width, preview }: { width: number; preview: boolean }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(preview ? PREVIEW_SCALE : 1, {
      damping: 13,
      stiffness: 210,
      mass: 0.8,
    });
  }, [preview, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedGlassView
      glassEffectStyle="regular"
      isInteractive
      style={[
        { width, height: TAB_HEIGHT, borderRadius: TAB_HEIGHT / 2 },
        animatedStyle,
      ]}
    />
  );
}

// Иконка таба в overlay. Скейлится синхронно с glass-табом.
function IconSlot({
  routeName,
  active,
  preview,
}: {
  routeName: string;
  active: boolean;
  preview: boolean;
}) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(preview ? PREVIEW_SCALE : 1, {
      damping: 13,
      stiffness: 210,
      mass: 0.8,
    });
    translateY.value = withSpring(preview ? -2 : 0, {
      damping: 13,
      stiffness: 210,
      mass: 0.8,
    });
  }, [preview, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { flex: 1, height: TAB_HEIGHT, alignItems: 'center', justifyContent: 'center' },
        animatedStyle,
      ]}
    >
      {ICONS[routeName]?.(active)}
    </Animated.View>
  );
}

interface FallbackBarProps {
  routes: BottomTabBarProps['state']['routes'];
  activeIndex: number;
  previewIndex: number | null;
}

// ── Fallback (Android / web / iOS<26): BlurView + per-tab pop-пилюля.
function FallbackBar({ routes, activeIndex, previewIndex }: FallbackBarProps) {
  return (
    <>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: BAR_HEIGHT / 2,
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

function FallbackTabItem({
  routeName,
  active,
  preview,
}: {
  routeName: string;
  active: boolean;
  preview: boolean;
}) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const bgOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(preview ? 1.18 : 1, { damping: 12, stiffness: 200 });
    translateY.value = withSpring(preview ? -6 : 0, { damping: 12, stiffness: 200 });
    bgOpacity.value = withTiming(preview ? 1 : 0, { duration: 160 });
  }, [preview, scale, translateY, bgOpacity]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { flex: 1, height: TAB_HEIGHT, alignItems: 'center', justifyContent: 'center' },
        containerStyle,
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
