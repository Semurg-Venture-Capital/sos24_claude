import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  type LayoutChangeEvent,
  PanResponder,
  Pressable,
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

// На iOS 26+ доступна Liquid Glass API от Apple — рендерится через UIVisualEffectView
// (как в системных tab bar / Control Center). На остальных платформах fallback на BlurView.
const USE_LIQUID_GLASS = isLiquidGlassAvailable();

// Bottom-tab бар: glass-капсула 68px высотой. Активный таб отличается заливкой
// иконки (TabIcons автоматически filled на active). Поверх — PanResponder:
// тап → обычная навигация через Pressable, слайд пальцем по бару → меняет
// табы в реальном времени (как iOS-segment scrubber).
export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const [barWidth, setBarWidth] = useState(0);
  const numTabs = state.routes.length;

  const navigateByX = useCallback(
    (x: number) => {
      if (barWidth <= 0) return;
      const idx = Math.min(numTabs - 1, Math.max(0, Math.floor((x / barWidth) * numTabs)));
      const target = state.routes[idx];
      if (target && state.index !== idx) {
        navigation.navigate(target.name);
      }
    },
    [barWidth, numTabs, state.index, state.routes, navigation],
  );

  // PanResponder активируется только при движении пальца > 4px,
  // чтобы тапы (без drag) проходили через дочерние Pressable.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 4,
        onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dx) > 4,
        onPanResponderGrant: (e) => navigateByX(e.nativeEvent.locationX),
        onPanResponderMove: (e) => navigateByX(e.nativeEvent.locationX),
      }),
    [navigateByX],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  };

  const tabs = state.routes.map((route, i) => {
    const active = state.index === i;
    const iconFn = ICONS[route.name];
    return (
      <Pressable
        key={route.key}
        onPress={() => navigation.navigate(route.name)}
        style={{
          flex: 1,
          height: 56,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent', // выбранный таб больше не подсвечивается белой плиткой
        }}
      >
        {iconFn?.(active)}
      </Pressable>
    );
  });

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
        overflow: 'hidden',
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
