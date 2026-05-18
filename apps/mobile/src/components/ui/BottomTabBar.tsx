import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { GlassContainer, GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  type LayoutChangeEvent,
  PanResponder,
  View,
} from 'react-native';
import { TabIconCar, TabIconHome, TabIconShield, TabIconUser } from '../icons/TabIcons';
import { tokens } from '../../theme/colors';

const ICONS: Record<string, (active: boolean) => ReactNode> = {
  Home: (active) => <TabIconHome active={active} color={active ? tokens.inkDark : 'rgba(20,20,20,0.32)'} />,
  Policies: (active) => <TabIconShield active={active} color={active ? tokens.inkDark : 'rgba(20,20,20,0.32)'} />,
  Garage: (active) => <TabIconCar active={active} color={active ? tokens.inkDark : 'rgba(20,20,20,0.32)'} />,
  Profile: (active) => <TabIconUser active={active} color={active ? tokens.inkDark : 'rgba(20,20,20,0.32)'} />,
};

const USE_LIQUID_GLASS = isLiquidGlassAvailable();

// Animated wrapper для GlassView — нужен чтобы transform.scale работал через
// useNativeDriver. createAnimatedComponent оборачивает native-компонент.
const AnimatedGlassView = Animated.createAnimatedComponent(GlassView);

// Bottom tab bar.
// ────────────────────────────────────────────────────────────────────────
// Liquid Glass путь (iOS 26+):
//   GlassContainer со spacing объединяет несколько GlassView в один
//   «жидкий» пузырь — соседи мерджатся в общую форму, при scale одного
//   из них «бар вытягивается» вокруг него → эффект как «лупа» в App Store.
//   Каждый таб — отдельный GlassView, scale через Animated на нём.
//
// Fallback путь (Android / iOS < 26 / web):
//   Single BlurView для всего бара + отдельный белый pop-индикатор
//   под пальцем. Без morph-эффекта, но визуально приятно.
// ────────────────────────────────────────────────────────────────────────
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
        height: 68,
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
}

// ── Liquid Glass путь: каждый таб = отдельный GlassView внутри GlassContainer.
// spacing управляет порогом слияния — при достаточном расстоянии соседи мерджатся
// в единую форму. При scale одного из них бар «вытягивается» вокруг него (morph).
function LiquidGlassBar({ routes, activeIndex, previewIndex }: BarProps) {
  return (
    <>
      <GlassContainer
        spacing={20}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 6,
          paddingVertical: 6,
          gap: 4,
          borderRadius: 999,
        }}
      >
        {routes.map((route, i) => (
          <GlassTabSegment key={route.key} preview={previewIndex === i} />
        ))}
      </GlassContainer>

      {/* Icons overlay поверх glass — одинаковая разметка как у GlassContainer,
          табы-иконки центрированы над каждым glass-сегментом. */}
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
          paddingHorizontal: 6,
          paddingVertical: 6,
          gap: 4,
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

// Один glass-сегмент в bar'е. Scale во время preview → бар morph'ит через
// GlassContainer-merge. translateY чуть приподнимает наружу.
function GlassTabSegment({ preview }: { preview: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: preview ? 1.25 : 1,
      useNativeDriver: true,
      friction: 6,
      tension: 140,
    }).start();
    Animated.spring(translateY, {
      toValue: preview ? -4 : 0,
      useNativeDriver: true,
      friction: 6,
      tension: 140,
    }).start();
  }, [preview, scale, translateY]);

  return (
    <AnimatedGlassView
      glassEffectStyle="regular"
      isInteractive
      style={{
        flex: 1,
        height: 56,
        borderRadius: 999,
        transform: [{ scale }, { translateY }],
      }}
    />
  );
}

// ── Fallback (Android / web / старый iOS): один BlurView + pop-индикатор.
function FallbackBar({ routes, activeIndex, previewIndex }: BarProps) {
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

      {/* Tabs with animated pop pill (без морфа) */}
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
          paddingHorizontal: 6,
          paddingVertical: 6,
          gap: 4,
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
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: preview ? 1.18 : 1,
      useNativeDriver: true,
      friction: 6,
      tension: 140,
    }).start();
    Animated.spring(translateY, {
      toValue: preview ? -6 : 0,
      useNativeDriver: true,
      friction: 6,
      tension: 140,
    }).start();
    Animated.timing(bgOpacity, {
      toValue: preview ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [preview, scale, translateY, bgOpacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        flex: 1,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale }, { translateY }],
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 999,
          backgroundColor: '#ffffff',
          opacity: bgOpacity,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.18,
          shadowRadius: 10,
          elevation: 4,
        }}
      />
      {ICONS[routeName]?.(active)}
    </Animated.View>
  );
}
