import { Text, View } from 'react-native';
import { tokens } from '../../theme/colors';

interface Props {
  num: number;
  title: string;
  body: string;
}

// Пронумерованный шаг для секции "Как это работает" (M4.2).
export function StepRow({ num, title, body }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 8,
        paddingHorizontal: 4,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          backgroundColor: tokens.inkDark,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 13, color: '#fff' }}>
          {num}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            fontFamily: 'Manrope_600SemiBold',
            fontSize: 14,
            color: tokens.ink,
            letterSpacing: -0.07,
          }}
        >
          {title}
        </Text>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted }}>
          {body}
        </Text>
      </View>
    </View>
  );
}
