import { useRef } from 'react';
import { Animated } from 'react-native';

// Поведение «large title» как в App Store: плавающий заголовок плавно исчезает
// при скролле вверх (контент уходит под него) и появляется обратно при скролле
// к началу. Возвращает onScroll для Animated.ScrollView и анимированный стиль
// для заголовка (opacity + лёгкий сдвиг вверх).
export function useCollapsingHeader(distance = 48) {
  const scrollY = useRef(new Animated.Value(0)).current;

  const opacity = scrollY.interpolate({
    inputRange: [0, distance],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const translateY = scrollY.interpolate({
    inputRange: [0, distance],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: true,
  });

  return {
    onScroll,
    headerAnimatedStyle: { opacity, transform: [{ translateY }] },
  };
}
