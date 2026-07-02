import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { tokens } from '../../../theme/colors';

export type MedChipTone = 'ink' | 'red' | 'yellow';

const PALETTE: Record<MedChipTone, { bg: string; fg: string }> = {
  ink: { bg: 'rgba(20,20,20,0.06)', fg: tokens.inkDark },
  red: { bg: 'rgba(230,20,40,0.1)', fg: tokens.red },
  yellow: { bg: 'rgba(245,200,80,0.5)', fg: '#503a07' },
};

// Чип-пилюля M14: симптомы, теги, статусы. Опциональная иконка слева.
export function MedChip({
  children,
  tone = 'ink',
  icon,
}: {
  children: ReactNode;
  tone?: MedChipTone;
  icon?: ReactNode;
}) {
  const palette = PALETTE[tone];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 13,
        borderRadius: 999,
        backgroundColor: palette.bg,
      }}
    >
      {icon}
      <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: palette.fg }}>{children}</Text>
    </View>
  );
}
