import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { tokens } from '../../../theme/colors';
import { medGlass } from './medGlass';

export type MedTileTone = 'red' | 'green' | 'blue' | 'glass';

const PALETTE: Record<MedTileTone, { bg: string; fg: string }> = {
  red: { bg: 'rgba(230,20,40,0.1)', fg: tokens.red },
  green: { bg: 'rgba(105,228,183,0.5)', fg: '#0a3a26' },
  blue: { bg: 'rgba(86,140,255,0.16)', fg: '#1a3577' },
  glass: { bg: 'rgba(20,20,20,0.06)', fg: tokens.inkDark },
};

// Быстрая плитка хаба (M14.1): круглая иконка + заголовок + подпись.
// Иконку передаём готовой (render-prop получает цвет тона).
export function MedQuickTile({
  title,
  sub,
  tone = 'glass',
  icon,
  onPress,
}: {
  title: string;
  sub: string;
  tone?: MedTileTone;
  icon?: (color: string) => ReactNode;
  onPress?: () => void;
}) {
  const palette = PALETTE[tone];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flex: 1,
          paddingTop: 16,
          paddingHorizontal: 16,
          paddingBottom: 18,
          borderRadius: 24,
          gap: 12,
          opacity: pressed ? 0.75 : 1,
        },
        medGlass,
      ]}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 999,
          backgroundColor: palette.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon?.(palette.fg)}
      </View>
      <View style={{ gap: 2 }}>
        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 15, color: tokens.ink }}>{title}</Text>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted, lineHeight: 16 }}>
          {sub}
        </Text>
      </View>
    </Pressable>
  );
}
