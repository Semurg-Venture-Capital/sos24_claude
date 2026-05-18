import type { ReactNode } from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import { tokens } from '../../theme/colors';

interface Props {
  title: ReactNode;
  subtitle?: ReactNode;
  style?: ViewStyle;
}

export function ScreenHeading({ title, subtitle, style }: Props) {
  return (
    <View style={style}>
      <Text
        style={{
          fontFamily: 'NeueMontreal-Medium',
          fontWeight: '500',
          fontSize: 28,
          letterSpacing: -0.28,
          color: tokens.ink,
          lineHeight: 32,
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{
            marginTop: 10,
            fontFamily: 'Manrope_400Regular',
            fontSize: 16,
            color: tokens.inkMuted,
            letterSpacing: -0.08,
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}
