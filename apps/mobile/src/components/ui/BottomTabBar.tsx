import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { TabIconCar, TabIconHome, TabIconShield, TabIconUser } from '../icons/TabIcons';
import { tokens } from '../../theme/colors';

const ICONS: Record<string, (active: boolean) => ReactNode> = {
  Home: (active) => <TabIconHome active={active} color={active ? tokens.inkDark : 'rgba(20,20,20,0.32)'} />,
  Policies: (active) => <TabIconShield active={active} color={active ? tokens.inkDark : 'rgba(20,20,20,0.32)'} />,
  Garage: (active) => <TabIconCar active={active} color={active ? tokens.inkDark : 'rgba(20,20,20,0.32)'} />,
  Profile: (active) => <TabIconUser active={active} color={active ? tokens.inkDark : 'rgba(20,20,20,0.32)'} />,
};

// На iOS 26+ доступна Liquid Glass API от Apple — рендерится через UIVisualEffectView
// с эффектом, как в iOS 26 системных tab bar / Control Center. Проверяем
// доступность на этапе рендера: если поддерживается — используем GlassView,
// иначе fallback на BlurView (старые iOS, Android, web).
const USE_LIQUID_GLASS = isLiquidGlassAvailable();

// Кастомный bottom-tab бар: glass-капсула 68px высотой, активный таб — белая
// pill внутри. Эталон: SOS24/sos-system.jsx → BottomTabBar.
export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
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
          backgroundColor: active ? 'rgba(255,255,255,0.92)' : 'transparent',
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
        <GlassView
          glassEffectStyle="regular"
          isInteractive
          style={innerStyle}
        >
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
