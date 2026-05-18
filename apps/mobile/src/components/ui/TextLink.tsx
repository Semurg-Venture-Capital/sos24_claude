import type { ReactNode } from 'react';
import { Pressable, Text, type TextStyle } from 'react-native';
import { tokens } from '../../theme/colors';

interface Props {
  children: ReactNode;
  onPress?: () => void;
  color?: string;
  style?: TextStyle;
}

export function TextLink({ children, onPress, color = tokens.inkSubtle, style }: Props) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      {({ pressed }) => (
        <Text
          style={[
            {
              color,
              fontFamily: 'Manrope_500Medium',
              fontSize: 14,
              letterSpacing: -0.07,
              opacity: pressed ? 0.6 : 1,
            },
            style,
          ]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}
