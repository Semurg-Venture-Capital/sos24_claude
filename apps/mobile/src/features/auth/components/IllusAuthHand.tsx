import { Text, View } from 'react-native';
import { SosLogo } from '../../../components/ui/SosLogo';
import { SosMark } from '../../../components/icons/SosMark';
import { tokens } from '../../../theme/colors';

// Декоративная иллюстрация на AuthChoose: две карточки в стиле полиса+CTA,
// слегка повёрнуты, имитируют стопку карт.
export function IllusAuthHand() {
  return (
    <View style={{ width: 280, height: 160 }}>
      {/* Back red card */}
      <View
        style={{
          position: 'absolute',
          left: 8,
          top: 36,
          width: 224,
          height: 136,
          borderRadius: 28,
          backgroundColor: 'rgba(230,20,40,0.85)',
          padding: 18,
          justifyContent: 'space-between',
          transform: [{ rotate: '4deg' }],
          shadowColor: tokens.red,
          shadowOffset: { width: 0, height: 24 },
          shadowOpacity: 0.45,
          shadowRadius: 24,
          elevation: 4,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <SosMark size={16} color="#fff" />
          <Text style={{ fontFamily: 'NeueMontreal-Bold', fontSize: 14, color: '#fff' }}>SOS24</Text>
        </View>
        <Text
          style={{
            fontFamily: 'NeueMontreal-Medium',
            fontSize: 18,
            color: '#fff',
            lineHeight: 22,
          }}
        >
          Заявить ДТП{'\n'}за 2 минуты
        </Text>
      </View>
      {/* Front white card */}
      <View
        style={{
          position: 'absolute',
          left: 28,
          top: 12,
          width: 224,
          height: 136,
          borderRadius: 28,
          backgroundColor: 'rgba(255,255,255,0.7)',
          padding: 18,
          justifyContent: 'space-between',
          transform: [{ rotate: '-3deg' }],
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.7)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 24 },
          shadowOpacity: 0.18,
          shadowRadius: 24,
          elevation: 6,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <SosLogo size="md" />
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 10, color: tokens.inkMuted, letterSpacing: 1 }}>
            ОСАГО
          </Text>
        </View>
        <Text
          style={{
            fontFamily: 'NeueMontreal-Medium',
            fontSize: 18,
            color: tokens.inkDark,
            letterSpacing: -0.09,
          }}
        >
          01 A 123 BB
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 11, color: tokens.inkMuted }}>
            Активен до
          </Text>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: tokens.inkDark }}>
            11.05.2027
          </Text>
        </View>
      </View>
    </View>
  );
}
