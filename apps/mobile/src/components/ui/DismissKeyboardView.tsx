import type { ReactNode } from 'react';
import { Keyboard, TouchableWithoutFeedback, View, type ViewStyle } from 'react-native';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
}

// Обёртка для форм: тап в любое место вне TextInput/Pressable закрывает клавиатуру.
// Использует TouchableWithoutFeedback с accessible={false}, чтобы не ломать
// доступность вложенных интерактивных элементов.
export function DismissKeyboardView({ children, style }: Props) {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[{ flex: 1 }, style]}>{children}</View>
    </TouchableWithoutFeedback>
  );
}
