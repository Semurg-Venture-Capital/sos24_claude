import { Glass } from './Glass';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from '../icons/ChevronRight';
import { tokens } from '../../theme/colors';

interface Props {
  type: string;
  car: string;
  plate: string;
  expiredAt: string;
  onPress?: () => void;
}

// Архивная карточка полиса — приглушённая, маленькая.
export function PolicyListCardCompact({ type, car, plate, expiredAt, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 20,
        overflow: 'hidden',
        opacity: pressed ? 0.6 : 0.7,
      })}
    >
      <Glass
        intensity={20}
        tint="light"
        style={{
          backgroundColor: 'rgba(255,255,255,0.4)',
          paddingVertical: 14,
          paddingHorizontal: 18,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          borderWidth: 1,
          borderColor: tokens.hairline,
        }}
      >
        <View
          style={{
            paddingHorizontal: 9,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: 'rgba(20,20,20,0.06)',
          }}
        >
          <Text
            style={{
              fontFamily: 'Manrope_600SemiBold',
              fontSize: 11,
              color: tokens.inkMuted,
              letterSpacing: 0.22,
            }}
          >
            {type}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              fontFamily: 'NeueMontreal-Medium',
              fontSize: 15,
              color: tokens.inkDark,
            }}
            numberOfLines={1}
          >
            {plate}
          </Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 11, color: tokens.inkMuted }}>
            {car} · истёк {expiredAt}
          </Text>
        </View>
        <ChevronRight size={12} />
      </Glass>
    </Pressable>
  );
}
