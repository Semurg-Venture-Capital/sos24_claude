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

// На iOS 26+ доступен Apple Liquid Glass — UIVisualEffectView с эффектом
// из системного tab bar / Control Center. На остальных платформах fallback BlurView.
const USE_LIQUID_GLASS = isLiquidGlassAvailable();

// Bottom-tab бар с pop-эффектом по типу Telegram:
// - tap/drag по бару → previewIndex обновляется, под пальцем таб увеличивается
//   и поднимается вверх с полупрозрачной пилюлей-фоном
// - на отпускании пальца — navigate на тот таб, на котором палец завершил жест
// - до отпускания таб не переключается (preview не равен navigation state.index)
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

  // PanResponder перехватывает все жесты на баре (включая обычный tap).
  // Дочерние tab-айтемы имеют pointerEvents="none", так что не претендуют на жесты.
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

  const innerStyle = {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 6,
    gap: 4,
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
        shadowColor: 'rgb(201,201,201)',
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.55,
        shadowRadius: 40,
        elevation: 12,
      }}
    >
      {/* overflow:visible на внешнем View, чтобы pop'нутый таб не подрезался
          по верхнему краю при scale > 1 и translateY < 0. Glass-обёртка
          внутри имеет overflow:hidden — округлая капсула без артефактов. */}
      <View style={{ flex: 1, borderRadius: 999, overflow: 'hidden' }}>
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
    </View>
  );
}

interface TabItemProps {
  routeName: string;
  active: boolean;
  preview: boolean;
}

// Один таб: иконка + анимированный pop-эффект во время preview.
// pointerEvents="none" — жесты захватываются внешним PanResponder.
function TabItem({ routeName, active, preview }: TabItemProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: preview ? 1.22 : 1,
      useNativeDriver: true,
      friction: 6,
      tension: 120,
    }).start();
    Animated.spring(translateY, {
      toValue: preview ? -6 : 0,
      useNativeDriver: true,
      friction: 6,
      tension: 120,
    }).start();
    Animated.timing(bgOpacity, {
      toValue: preview ? 1 : 0,
      duration: 140,
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
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale }, { translateY }],
      }}
    >
      {/* Полупрозрачная пилюля под пальцем (только во время preview) */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.6)',
          opacity: bgOpacity,
        }}
      />
      {iconFn?.(active)}
    </Animated.View>
  );
}
