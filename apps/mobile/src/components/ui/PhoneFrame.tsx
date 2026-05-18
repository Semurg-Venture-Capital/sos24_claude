import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../theme/colors';

interface Props {
  children: ReactNode;
  bg?: string;
}

// Дизайн рисовался в 390×844. На реальном устройстве используем всю ширину
// (390 ≈ ширина iPhone 14/15). Pageбэкграунд тот же warm-light-grey, что и в
// эталоне. Иконки statusbar и время — это родной системный StatusBar, мы их
// не рендерим. SafeAreaView выдаёт top inset, чтобы контент не лез под чёлку.
export function PhoneFrame({ children, bg = tokens.pageBg }: Props) {
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {children}
      </SafeAreaView>
    </View>
  );
}
