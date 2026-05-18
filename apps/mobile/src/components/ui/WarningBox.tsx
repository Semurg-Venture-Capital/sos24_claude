import { Text, View } from 'react-native';
import { tokens } from '../../theme/colors';

interface Props {
  text: string;
}

// Жёлтый info-box со знаком ! для предупреждений в формах.
export function WarningBox({ text }: Props) {
  return (
    <View
      style={{
        padding: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(245,200,80,0.16)',
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          backgroundColor: tokens.yellow,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#503a07', fontFamily: 'Manrope_700Bold', fontSize: 13, lineHeight: 14 }}>!</Text>
      </View>
      <Text
        style={{
          flex: 1,
          fontFamily: 'Manrope_400Regular',
          fontSize: 13,
          color: '#5e4811',
          lineHeight: 18,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
