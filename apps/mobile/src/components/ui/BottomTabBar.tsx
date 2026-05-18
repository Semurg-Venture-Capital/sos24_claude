import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
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

// Кастомный bottom-tab бар: glass-капсула 68px высотой, активный таб — белая
// pill внутри. Эталон: SOS24/sos-system.jsx → BottomTabBar.
export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
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
      <BlurView
        intensity={32}
        tint="light"
        style={{
          flex: 1,
          backgroundColor: 'rgba(255,255,255,0.5)',
          flexDirection: 'row',
          alignItems: 'center',
          padding: 6,
          gap: 4,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.5)',
        }}
      >
        {state.routes.map((route, i) => {
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
        })}
      </BlurView>
    </View>
  );
}
