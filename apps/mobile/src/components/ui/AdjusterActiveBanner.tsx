import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { AdjusterRequest, AdjusterStatus } from '../../api/adjuster';
import { tokens } from '../../theme/colors';

const STATUS_LABEL: Record<AdjusterStatus, string> = {
  NEW: 'Ищем аджастера',
  ACCEPTED: 'Аджастер назначен',
  EN_ROUTE: 'Аджастер в пути',
  COMPLETED: 'Аджастер прибыл',
  CANCELLED: 'Отменено',
};

interface Props {
  request: AdjusterRequest;
  onPress: () => void;
}

export function AdjusterActiveBanner({ request, onPress }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (request.status === 'COMPLETED' || request.status === 'CANCELLED') return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.25, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [request.status]);

  const dotColor =
    request.status === 'COMPLETED' ? tokens.green :
    request.status === 'CANCELLED' ? tokens.inkMuted :
    tokens.red;

  const borderColor =
    request.status === 'CANCELLED' ? tokens.hairline :
    request.status === 'COMPLETED' ? 'rgba(105,228,183,0.3)' :
    'rgba(230,20,40,0.2)';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.75)',
        borderRadius: 20, padding: 14, paddingHorizontal: 16,
        borderWidth: 1.5, borderColor,
        gap: 12,
        opacity: pressed ? 0.88 : 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      })}
    >
      {/* Pulsing dot */}
      <Animated.View
        style={{
          width: 10, height: 10, borderRadius: 5,
          backgroundColor: dotColor,
          opacity: request.status === 'COMPLETED' || request.status === 'CANCELLED' ? 1 : pulse,
          flexShrink: 0,
        }}
      />

      {/* Text */}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{
          fontFamily: 'Manrope_600SemiBold',
          fontSize: 14,
          color: tokens.ink,
          letterSpacing: -0.08,
        }}>
          {STATUS_LABEL[request.status]}
        </Text>
        <Text
          style={{
            fontFamily: 'Manrope_400Regular',
            fontSize: 12,
            color: tokens.inkMuted,
          }}
          numberOfLines={1}
        >
          {request.adjusterDisplayName
            ? `${request.adjusterDisplayName}${request.adjusterDisplayPhone ? ` · ${request.adjusterDisplayPhone}` : ''}`
            : request.address}
        </Text>
      </View>

      {/* Chevron + label */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.red }}>
          Подробнее
        </Text>
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={tokens.red} strokeWidth={2} strokeLinecap="round">
          <Path d="M9 18l6-6-6-6" />
        </Svg>
      </View>
    </Pressable>
  );
}
