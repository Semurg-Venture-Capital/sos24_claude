import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import {
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

// Двойная проверка для iOS 26 beta-стабильности.
let USE_LIQUID_GLASS = false;
try {
  USE_LIQUID_GLASS = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
} catch {
  USE_LIQUID_GLASS = false;
}

const HORIZONTAL_PADDING = 6;
const GAP = 4;
const BAR_HEIGHT = 68;
const TAB_HEIGHT = 56;

// Bottom tab. Структура двух слоёв:
//   1. Background: GlassView (iOS 26+) или BlurView, клиппинг к капсуле
//   2. Tabs: ряд табов поверх, каждый со своей pop-анимацией (Reanimated)
//      без клиппинга, чтобы pop мог приподниматься над баром
//
// GlassContainer с merge-эффектом пока не используется — он плохо ладит
// с absolute-позиционированными детьми (HostFunction exception). Морф можно
// добавить позже отдельной задачей через flex-layout детей.
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
      {/* Слой 1: фон-капсула (glass или blur, клиппинг для скругления) */}
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
        {USE_LIQUID_GLASS ? (
          <GlassView glassEffectStyle="regular" style={{ flex: 1 }} />
        ) : (
          <BlurView
            intensity={32}
            tint="light"
            style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.5)' }}
          />
        )}
      </View>

      {/* Слой 2: табы поверх — не клипуются, pop может приподниматься выше бара */}
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
        {state.routes.map((route, i) => (
          <TabItem
            key={route.key}
            routeName={route.name}
            active={state.index === i}
            preview={previewIndex === i}
          />
        ))}
      </View>
    </View>
  );
}

interface TabItemProps {
  routeName: string;
  active: boolean;
  preview: boolean;
}

function TabItem({ routeName, active, preview }: TabItemProps) {
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
        {
          flex: 1,
          height: TAB_HEIGHT,
          alignItems: 'center',
          justifyContent: 'center',
        },
        containerStyle,
      ]}
    >
      {/* Белая пилюля под пальцем — высокий контраст на glass-фоне */}
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
