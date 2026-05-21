import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../theme/colors';

interface Props {
  children: ReactNode;
  bg?: string;
  // На экранах с native tab bar bottom safe-area не нужен — таб-бар сам
  // учитывает home-indicator, контент должен скроллиться под ним fullbleed.
  bottomSafeArea?: boolean;
  // Топ safe-area: если false — экран идёт до самого верха под dynamic island.
  // Контент тогда сам должен учитывать insets через useSafeAreaInsets().
  topSafeArea?: boolean;
}

// Дизайн рисовался в 390×844. На реальном устройстве используем всю ширину
// (390 ≈ ширина iPhone 14/15). Pageбэкграунд тот же warm-light-grey, что и в
// эталоне.
export function PhoneFrame({
  children,
  bg = tokens.pageBg,
  bottomSafeArea = true,
  topSafeArea = true,
}: Props) {
  const edges = [
    ...(topSafeArea ? (['top'] as const) : []),
    ...(bottomSafeArea ? (['bottom'] as const) : []),
  ];
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
}
