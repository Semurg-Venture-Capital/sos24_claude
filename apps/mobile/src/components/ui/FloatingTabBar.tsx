import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabIconCar, TabIconHeart, TabIconHome, TabIconShield, TabIconUser } from '../icons/TabIcons';
import { tokens } from '../../theme/colors';

// Плавающий нижний бар для Android (Вариант 3, fintech-стиль): белая капсула с тенью,
// активная вкладка — красная пилюля-индикатор, которая плавно перетекает.
// Иконки — наши кросс-платформенные SVG (как на iOS). iOS использует нативный таб-бар.

const ICONS: Record<string, (p: { size?: number; color?: string; active?: boolean }) => React.ReactElement> = {
  Home: TabIconHome,
  Policies: TabIconShield,
  Health: TabIconHeart,
  Garage: TabIconCar,
  Profile: TabIconUser,
};
const LABELS: Record<string, string> = {
  Home: 'Главная',
  Policies: 'Полисы',
  Health: 'Здоровье',
  Garage: 'Гараж',
  Profile: 'Профиль',
};

const H_MARGIN = 16;
const BAR_HEIGHT = 64;
const PILL_INSET = 6;

export function FloatingTabBar({ state, navigation, descriptors }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Скрываем бар, если активная вкладка попросила tabBarStyle.display:'none'
  // (например, детальная страница авто внутри стека Гаража).
  const focusedOptions = descriptors[state.routes[state.index].key]?.options;
  const tabBarStyle = focusedOptions?.tabBarStyle as { display?: 'flex' | 'none' } | undefined;
  if (tabBarStyle?.display === 'none') return null;

  const n = state.routes.length;
  const barWidth = width - H_MARGIN * 2;
  const tabWidth = barWidth / n;

  // Положение красной пилюли = левый край активной вкладки.
  const pillX = useRef(new Animated.Value(state.index * tabWidth)).current;
  useEffect(() => {
    Animated.spring(pillX, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      friction: 8,
      tension: 90,
    }).start();
  }, [state.index, tabWidth, pillX]);

  const navigate = (i: number) => {
    const route = state.routes[i];
    const focused = state.index === i;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
  };

  const pillR = (BAR_HEIGHT - PILL_INSET * 2) / 2;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: H_MARGIN, right: H_MARGIN, bottom: insets.bottom + 8 }}
    >
      <View
        style={{
          height: BAR_HEIGHT,
          borderRadius: BAR_HEIGHT / 2,
          backgroundColor: '#FFFFFF',
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.16,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 10,
        }}
      >
        {/* Красная пилюля-индикатор под активной вкладкой. */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: PILL_INSET,
            top: PILL_INSET,
            width: tabWidth - PILL_INSET * 2,
            height: BAR_HEIGHT - PILL_INSET * 2,
            borderRadius: pillR,
            backgroundColor: 'rgba(230,20,40,0.10)',
            transform: [{ translateX: pillX }],
          }}
        />

        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const Icon = ICONS[route.name];
          const label = LABELS[route.name] ?? route.name;
          const color = focused ? tokens.red : tokens.inkMuted;
          return (
            <Pressable
              key={route.key}
              onPress={() => navigate(i)}
              android_ripple={{ color: 'rgba(230,20,40,0.10)', borderless: true, radius: tabWidth / 2 }}
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
  );
}
