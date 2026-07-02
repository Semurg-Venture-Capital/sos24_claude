import { Text, View } from 'react-native';
import { tokens } from '../../../theme/colors';
import { medGlass } from './medGlass';

// Строка «ключ — значение» в мед.карте (M14.9): аллергии, хронические, лекарства и т.д.
export function MedCardRow({
  label,
  value,
  valueColor,
  multiline,
}: {
  label: string;
  value: string;
  valueColor?: string;
  multiline?: boolean;
}) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: 16,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 18,
        },
        medGlass,
      ]}
    >
      <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted }}>{label}</Text>
      <Text
        style={{
          flex: 1,
          textAlign: 'right',
          fontFamily: 'Manrope_500Medium',
          fontSize: 14,
          color: valueColor || tokens.ink,
          lineHeight: 20,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
