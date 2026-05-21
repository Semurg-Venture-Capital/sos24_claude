import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { tokens } from '../../theme/colors';

interface Props {
  onPress?: () => void;
}

// Красный баннер "SOS — экстренная помощь" — primary CTA на Home.
export function SosBanner({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: tokens.red,
        borderRadius: 999,
        paddingVertical: 20,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: tokens.red,
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.45,
        shadowRadius: 20,
        elevation: 8,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 999,
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
        }}
      >
        <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 26, color: tokens.red, lineHeight: 28 }}>
          !
        </Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 20, color: '#fff', letterSpacing: -0.2 }}>
          SOS — экстренная помощь
        </Text>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMutedDark, letterSpacing: -0.07 }}>
          ДТП, мед. помощь, угон — поможем разобраться
        </Text>
      </View>
      <Svg width={8} height={14} viewBox="0 0 8 14" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
        <Path d="M1 1l6 6-6 6" />
      </Svg>
    </Pressable>
  );
}
