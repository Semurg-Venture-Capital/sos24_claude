import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { tokens } from '../../theme/colors';

interface Props {
  title: string;
  children: ReactNode;
}

// Контейнер секции — заголовок + список карточек/строк.
// Используется на M4.2 (Что покрывает / Не покрывает / Как работает / FAQ).
export function Section({ title, children }: Props) {
  return (
    <View style={{ gap: 12 }}>
      <Text
        style={{
          fontFamily: 'NeueMontreal-Medium',
          fontSize: 19,
          letterSpacing: -0.095,
          color: tokens.ink,
        }}
      >
        {title}
      </Text>
      <View style={{ gap: 8 }}>{children}</View>
    </View>
  );
}
