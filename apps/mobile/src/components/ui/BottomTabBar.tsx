import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
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

// На iOS 26+ — Apple Liquid Glass; на остальных платформах BlurView fallback.
const USE_LIQUID_GLASS = isLiquidGlassAvailable();

// Bottom tab с pop-эффектом как в Telegram:
// - tap или drag по бару → previewIndex отслеживает таб под пальцем
// - таб под пальцем: scale 1.18 + translateY -8 + полупрозрачная пилюля
// - до отпускания — preview, после release — navigate
//
// Структура (важно для корректного pop без клиппинга):
// - Внешний View (shadow, position:absolute, overflow:visible) — НЕ клипает
//   pop-таб, который выходит за верхнюю границу бара
// - GlassView / BlurView с borderRadius:999 — округлая капсула через
//   layer-level cornerRadius (без overflow:hidden, чтобы дети могли вылезать)
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

  const tabs = state.routes.map((route, i) => (
    <TabItem
      key={route.key}
      routeName={route.name}
      active={state.index === i}
      preview={previewIndex === i}
    />
  ));

  // Стиль для glass/blur контейнера. borderRadius:999 округляет
  // native-слой эффекта (UIVisualEffectView на iOS, BlurView на Android).
  // overflow по умолчанию visible — pop-таб виден над верхней границей.
  const innerStyle = {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
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
        borderRadius: 999,
        // overflow по умолчанию visible — pop-эффект НЕ обрезается;
        // тень iOS тоже видна без клиппинга.
        shadowColor: 'rgb(201,201,201)',
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.55,
        shadowRadius: 40,
        elevation: 12,
      }}
    >
      {USE_LIQUID_GLASS ? (
        <GlassView glassEffectStyle="regular" isInteractive style={innerStyle}>
          {tabs}
        </GlassView>
      ) : (
        <BlurView
          intensity={32}
          tint="light"
          style={{ ...innerStyle, backgroundColor: 'rgba(255,255,255,0.5)' }}
        >
          {tabs}
        </BlurView>
      )}
    </View>
  );
}

interface TabItemProps {
  routeName: string;
  active: boolean;
  preview: boolean;
}

// Один таб с pop-анимацией. pointerEvents="none" — все жесты у родителя.
function TabItem({ routeName, active, preview }: TabItemProps) {
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
      toValue: preview ? -8 : 0,
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

  const iconFn = ICONS[routeName];

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
      {/* Фон-пилюля под пальцем. Высокая opacity для контраста на glass-фоне.
          Лёгкая тень снизу даёт ощущение «приподнятости». */}
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
      {iconFn?.(active)}
    </Animated.View>
  );
}
