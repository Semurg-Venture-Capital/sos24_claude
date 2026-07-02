import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { tokens } from '../../../theme/colors';
import { medGlass } from './medGlass';

// Виталка мед.карты (M14.9): группа крови / рост / вес.
// accent — красная подсветка (напр. группа крови).
export function MedVital({
  label,
  value,
  unit,
  accent,
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
  icon?: ReactNode;
}) {
  return (
    <View
      style={[
        {
          flex: 1,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 20,
          gap: 8,
        },
        accent
          ? { backgroundColor: 'rgba(230,20,40,0.08)', borderWidth: 1, borderColor: 'rgba(230,20,40,0.18)' }
          : medGlass,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon}
        <Text
          style={{
            fontFamily: 'Manrope_600SemiBold',
            fontSize: 11,
            color: accent ? tokens.red : tokens.inkMuted,
            letterSpacing: 0.3,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <Text
          style={{
            fontFamily: 'NeueMontreal-Medium',
            fontSize: 24,
            letterSpacing: -0.24,
            color: accent ? tokens.red : tokens.ink,
          }}
        >
          {value}
        </Text>
        {unit ? <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted }}>{unit}</Text> : null}
      </View>
    </View>
  );
}
