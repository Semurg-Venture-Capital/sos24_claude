import { Glass } from './Glass';
import { Text, View, type ViewStyle } from 'react-native';
import { tokens } from '../../theme/colors';

type Tone = 'ink' | 'warn' | 'glass';

interface Props {
  label: string;
  value: string;
  tone?: Tone;
  style?: ViewStyle;
}

const palette: Record<Tone, { bg: string; fg: string; muted: string; isGlass?: boolean }> = {
  ink: { bg: tokens.inkDark, fg: '#fff', muted: tokens.inkMutedDark },
  warn: { bg: 'rgba(245,200,80,0.85)', fg: '#3a2a07', muted: 'rgba(80,58,7,0.75)' },
  glass: { bg: 'rgba(255,255,255,0.5)', fg: tokens.inkDark, muted: tokens.inkMuted, isGlass: true },
};

// Pill со счётчиком (используется на M8.1 — «Активных 2», «Истекает 1», «В архиве 5»)
export function StatPill({ label, value, tone = 'ink', style }: Props) {
  const p = palette[tone];
  const content = (
    <View style={{ padding: 14, gap: 4 }}>
      <Text
        style={{
          fontFamily: 'Manrope_500Medium',
          fontSize: 11,
          color: p.muted,
          letterSpacing: 0.44,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: 'NeueMontreal-Medium',
          fontSize: 22,
          letterSpacing: -0.22,
          color: p.fg,
          lineHeight: 24,
        }}
      >
        {value}
      </Text>
    </View>
  );

  return (
    <View
      style={[
        {
          flex: 1,
          borderRadius: 18,
          overflow: 'hidden',
          backgroundColor: p.isGlass ? undefined : p.bg,
          borderWidth: p.isGlass ? 1 : 0,
          borderColor: tokens.hairline,
        },
        style,
      ]}
    >
      {p.isGlass ? (
        <Glass intensity={20} tint="light" style={{ flex: 1, backgroundColor: p.bg }}>
          {content}
        </Glass>
      ) : (
        content
      )}
    </View>
  );
}
