import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { medGlass } from './medGlass';

// Скелетон-заглушка карточки (врач/клиника) на время загрузки списка.
// Мягкая пульсация серых блоков — форма повторяет MedDoctorCard.
function Bar({ w, h = 12, r = 6, style }: { w: number | string; h?: number; r?: number; style?: object }) {
  return <View style={[{ width: w as number, height: h, borderRadius: r, backgroundColor: 'rgba(20,20,20,0.07)' }, style]} />;
}

export function MedCardSkeleton() {
  return (
    <View style={[{ borderRadius: 24, padding: 16, gap: 14 }, medGlass]}>
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <View style={{ width: 58, height: 58, borderRadius: 999, backgroundColor: 'rgba(20,20,20,0.07)' }} />
        <View style={{ flex: 1, gap: 8 }}>
          <Bar w="70%" h={14} />
          <Bar w="45%" h={12} />
          <Bar w="55%" h={12} />
        </View>
      </View>
      <Bar w="100%" h={46} r={999} />
    </View>
  );
}

export function MedCardSkeletonList({ count = 4 }: { count?: number }) {
  const pulse = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View style={{ gap: 14, opacity: pulse }}>
      {Array.from({ length: count }).map((_, i) => (
        <MedCardSkeleton key={i} />
      ))}
    </Animated.View>
  );
}
