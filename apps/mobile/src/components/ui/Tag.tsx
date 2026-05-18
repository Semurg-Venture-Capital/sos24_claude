import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import { tokens } from '../../theme/colors';

type Tone = 'ink' | 'red' | 'green' | 'glass' | 'yellow';

interface Props {
  children: ReactNode;
  tone?: Tone;
  style?: ViewStyle;
}

const palette: Record<Tone, { bg: string; fg: string; isGlass?: boolean }> = {
  ink: { bg: tokens.inkDark, fg: '#fff' },
  red: { bg: tokens.red, fg: '#fff' },
  green: { bg: 'rgba(105,228,183,0.85)', fg: '#0a3a26' },
  glass: { bg: 'rgba(255,255,255,0.5)', fg: tokens.inkDark, isGlass: true },
  yellow: { bg: 'rgba(245,200,80,0.85)', fg: '#503a07' },
};

export function Tag({ children, tone = 'ink', style }: Props) {
  const p = palette[tone];
  const inner = (
    <Text
      style={{
        color: p.fg,
        fontFamily: 'Manrope_600SemiBold',
        fontSize: 11,
        letterSpacing: 0.22,
      }}
    >
      {children}
    </Text>
  );
  const base: ViewStyle = {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    overflow: 'hidden',
  };
  if (p.isGlass) {
    return (
      <View style={[base, style]}>
        <BlurView intensity={20} tint="light" style={{ ...base, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: p.bg }}>
          {inner}
        </BlurView>
      </View>
    );
  }
  return <View style={[base, { backgroundColor: p.bg }, style]}>{inner}</View>;
}
