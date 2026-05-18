import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';

interface Props {
  children: ReactNode;
}

// Горизонтальный скролл с 24px-полями по краям и 12px gap'ом.
// Используется для лент полисов и партнёров на Home.
export function HScroll({ children }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 24,
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      {children}
    </ScrollView>
  );
}
