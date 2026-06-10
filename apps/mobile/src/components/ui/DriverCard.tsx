import { Glass } from './Glass';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { tokens } from '../../theme/colors';

interface Props {
  name: string;
  doc: string;
  experience: string;
  onRemove?: () => void;
}

// Карточка водителя в шаге 2 калькулятора (с инициалами в круге +
// trash-кнопкой удаления).
export function DriverCard({ name, doc, experience, onRemove }: Props) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      style={{
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: tokens.hairline,
      }}
    >
      <Glass
        intensity={20}
        tint="light"
        style={{
          backgroundColor: 'rgba(255,255,255,0.5)',
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <LinearGradient
          colors={['#d6d6d6', '#f4f4f4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 14, color: tokens.inkDark }}>
            {initials}
          </Text>
        </LinearGradient>
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              fontFamily: 'Manrope_600SemiBold',
              fontSize: 14,
              color: tokens.ink,
              letterSpacing: -0.07,
            }}
          >
            {name}
          </Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>
            {doc} · стаж {experience}
          </Text>
        </View>
        {onRemove && (
          <Pressable onPress={onRemove} hitSlop={8} style={{ padding: 4 }}>
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke={tokens.inkMuted} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M2 4h12M6 4V2.5a1 1 0 011-1h2a1 1 0 011 1V4M4.5 4l1 9.5a1 1 0 001 .9h3a1 1 0 001-.9L11.5 4" />
            </Svg>
          </Pressable>
        )}
      </Glass>
    </View>
  );
}
