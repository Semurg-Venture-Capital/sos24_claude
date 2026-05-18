import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { tokens } from '../../theme/colors';

interface Props {
  text: string;
}

// Зелёный info-box с галочкой — «платёж защищён» (M7.1).
export function SecureNote({ text }: Props) {
  return (
    <View
      style={{
        padding: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(105,228,183,0.15)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          backgroundColor: tokens.green,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#0a3a26" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M9 12l2 2 4-4" />
          <Circle cx={12} cy={12} r={9} />
        </Svg>
      </View>
      <Text
        style={{
          flex: 1,
          fontFamily: 'Manrope_400Regular',
          fontSize: 13,
          color: '#0a3a26',
          lineHeight: 18,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
