import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SosMark } from '../../../components/icons/SosMark';
import { tokens } from '../../../theme/colors';

// Иллюстрация для онбординг-слайда 2: мини-телефон с картой и пином,
// плюс плавающий статус-пилл «Инспектор в пути».
export function IllusOnboardingHelp() {
  return (
    <View style={{ width: 320, height: 280 }}>
      {/* Phone shell */}
      <View
        style={{
          position: 'absolute',
          left: 60,
          top: 20,
          width: 180,
          height: 240,
          borderRadius: 32,
          backgroundColor: 'rgba(255,255,255,0.85)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 30 },
          shadowOpacity: 0.1,
          shadowRadius: 30,
          elevation: 6,
          borderWidth: 1,
          borderColor: 'rgba(20,20,20,0.06)',
          overflow: 'hidden',
        }}
      >
        {/* Mini map */}
        <View
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            right: 14,
            bottom: 14,
            borderRadius: 22,
            overflow: 'hidden',
            backgroundColor: '#e3e6e4',
          }}
        >
          {/* roads */}
          <Svg width="100%" height="100%" viewBox="0 0 160 200" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <Path d="M-10 70 Q60 50 90 90 T180 110" stroke="rgba(20,20,20,0.12)" strokeWidth={14} fill="none" strokeLinecap="round" />
            <Path d="M-10 70 Q60 50 90 90 T180 110" stroke="rgba(255,255,255,0.95)" strokeWidth={10} fill="none" strokeLinecap="round" />
            <Path d="M20 -10 L70 80 L60 220" stroke="rgba(20,20,20,0.1)" strokeWidth={12} fill="none" strokeLinecap="round" />
            <Path d="M20 -10 L70 80 L60 220" stroke="rgba(255,255,255,0.9)" strokeWidth={8} fill="none" strokeLinecap="round" />
          </Svg>
          {/* Pin */}
          <View style={{ position: 'absolute', left: 70, top: 80 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                backgroundColor: tokens.red,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: tokens.red,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.55,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <SosMark size={16} color="#fff" />
            </View>
          </View>
        </View>
      </View>
      {/* Floating commissar status pill */}
      <View
        style={{
          position: 'absolute',
          left: 12,
          top: 178,
          paddingVertical: 10,
          paddingLeft: 12,
          paddingRight: 14,
          borderRadius: 999,
          backgroundColor: '#fff',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.18,
          shadowRadius: 20,
          elevation: 8,
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
          <Text style={{ color: '#0a3a26', fontSize: 12, fontFamily: 'Manrope_700Bold' }}>✓</Text>
        </View>
        <View style={{ flexDirection: 'column' }}>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>
            Инспектор в пути
          </Text>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.inkDark }}>
            ~ 12 минут
          </Text>
        </View>
      </View>
    </View>
  );
}
