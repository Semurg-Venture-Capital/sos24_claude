import { Text, View } from 'react-native';
import { tokens } from '../../theme/colors';

interface Props {
  text: string;
}

// Строка-исключение со знаком × (что не покрывает на M4.2).
export function ExceptionRow({ text }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 4,
      }}
    >
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 999,
          backgroundColor: 'rgba(20,20,20,0.06)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 12, color: tokens.inkMuted }}>
          ×
        </Text>
      </View>
      <Text
        style={{
          fontFamily: 'Manrope_400Regular',
          fontSize: 14,
          color: tokens.inkSubtle,
          letterSpacing: -0.07,
          flex: 1,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
