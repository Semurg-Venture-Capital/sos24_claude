import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// Зелёная анимированная «галочка успеха» на M7.2.
export function SuccessTick() {
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ring, {
          toValue: 1,
          duration: 2400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ring, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    ).start();
  }, [ring]);

  const ringScale = ring.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.6] });
  const ringOpacity = ring.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  return (
    <View
      style={{
        width: 140,
        height: 140,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Outer animated ring */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 140,
          height: 140,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: 'rgba(105,228,183,0.35)',
          transform: [{ scale: ringScale }],
          opacity: ringOpacity,
        }}
      />
      {/* Inner static ring */}
      <View
        style={{
          position: 'absolute',
          width: 100,
          height: 100,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: 'rgba(105,228,183,0.5)',
        }}
      />
      {/* Halo background */}
      <View
        style={{
          position: 'absolute',
          width: 140,
          height: 140,
          borderRadius: 999,
          backgroundColor: 'rgba(105,228,183,0.08)',
        }}
      />
      {/* Tick circle */}
      <LinearGradient
        colors={['#69E4B7', '#34D399']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 88,
          height: 88,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#34D399',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.5,
          shadowRadius: 24,
          elevation: 8,
        }}
      >
        <Svg width={40} height={32} viewBox="0 0 40 32" fill="none" stroke="#fff" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M3 17l11 11L37 4" />
        </Svg>
      </LinearGradient>
    </View>
  );
}
