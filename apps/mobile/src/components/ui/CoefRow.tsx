import { Text, View } from 'react-native';
import { tokens } from '../../theme/colors';

interface Props {
  label: string;
  value: string;
  onDark?: boolean;
  noBorder?: boolean;
}

// Строка коэффициента в итоговом блоке стоимости (M5.4, M6 чекаут).
export function CoefRow({ label, value, onDark, noBorder }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        borderTopWidth: noBorder ? 0 : 1,
        borderTopColor: onDark ? 'rgba(255,255,255,0.06)' : tokens.hairline,
      }}
    >
      <Text
        style={{
          fontFamily: 'Manrope_400Regular',
          fontSize: 13,
          color: onDark ? tokens.inkMutedDark : tokens.inkMuted,
          letterSpacing: -0.065,
          flex: 1,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: 'Manrope_500Medium',
          fontSize: 13,
          color: onDark ? '#fff' : tokens.inkDark,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
