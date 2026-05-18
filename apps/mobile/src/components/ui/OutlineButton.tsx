import type { ReactNode } from 'react';
import { Pressable, Text, type ViewStyle } from 'react-native';
import { tokens } from '../../theme/colors';

interface Props {
  children: ReactNode;
  onPress?: () => void;
  tone?: 'dark' | 'red';
  style?: ViewStyle;
}

export function OutlineButton({ children, onPress, tone = 'dark', style }: Props) {
  const color = tone === 'red' ? tokens.red : tokens.inkDark;
  const borderColor = tone === 'red' ? 'rgba(230,20,40,0.5)' : 'rgba(20,20,20,0.16)';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: 'transparent',
          borderRadius: 999,
          height: 64,
          paddingHorizontal: 28,
          borderWidth: 1.5,
          borderColor,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Text
        style={{
          color,
          fontFamily: 'Manrope_600SemiBold',
          fontSize: 16,
          letterSpacing: -0.16,
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}
