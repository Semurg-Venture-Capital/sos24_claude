import { Text, View } from 'react-native';
import { SosMark } from '../icons/SosMark';
import { tokens } from '../../theme/colors';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}

const sizes = {
  sm: { mark: 16, sos: 14, twentyFour: 8 },
  md: { mark: 20, sos: 18, twentyFour: 10 },
  lg: { mark: 36, sos: 34, twentyFour: 18 },
  xl: { mark: 56, sos: 52, twentyFour: 24 },
};

export function SosLogo({ size = 'md', color = tokens.ink }: Props) {
  const s = sizes[size];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <SosMark size={s.mark} />
      <Text
        style={{
          fontFamily: 'NeueMontreal-Bold',
          fontSize: s.sos,
          color,
          letterSpacing: -s.sos * 0.02,
          lineHeight: s.sos,
        }}
      >
        SOS
      </Text>
      <Text
        style={{
          fontFamily: 'NeueMontreal-Medium',
          fontSize: s.twentyFour,
          color,
          lineHeight: s.twentyFour,
          alignSelf: 'flex-end',
          paddingBottom: 1,
        }}
      >
        24
      </Text>
    </View>
  );
}
