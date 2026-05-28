import { GlassView } from 'expo-glass-effect';
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { tokens } from '../../theme/colors';

interface Props {
  icon: ReactNode;
  label: string;
  dark?: boolean;
  onPress?: () => void;
  activeDot?: boolean;
  sublabel?: string;
}

// Tile быстрых действий 2×2 на Home. Поддерживает \n в label для двух строк.
export function ActionTile({ icon, label, dark, onPress, activeDot, sublabel }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!activeDot) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.2, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [activeDot]);

  const content = (
    <View style={{ flex: 1, padding: 20, paddingTop: 18, gap: 8 }}>
      <View style={{ width: 40, height: 40, justifyContent: 'center' }}>{icon}</View>
      <View style={{ marginTop: 'auto', gap: 2 }}>
        <Text
          style={{
            fontFamily: 'Manrope_700Bold',
            fontSize: 16,
            lineHeight: 19,
            letterSpacing: -0.16,
            color: dark ? '#fff' : tokens.ink,
          }}
        >
          {label}
        </Text>
        {sublabel ? (
          <Text
            style={{
              fontFamily: 'Manrope_400Regular',
              fontSize: 11,
              color: dark ? 'rgba(255,255,255,0.55)' : tokens.inkMuted,
            }}
            numberOfLines={1}
          >
            {sublabel}
          </Text>
        ) : null}
      </View>

      {/* Active indicator badge */}
      {activeDot && (
        <View style={{ position: 'absolute', top: 16, right: 16 }}>
          <Animated.View
            style={{
              width: 9, height: 9, borderRadius: 5,
              backgroundColor: tokens.red,
              opacity: pulse,
            }}
          />
        </View>
      )}
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        height: 142,
        borderRadius: 32,
        overflow: 'hidden',
        opacity: pressed ? 0.85 : 1,
        backgroundColor: dark ? tokens.inkDark : undefined,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: dark ? 0.12 : 0.05,
        shadowRadius: 12,
        elevation: 2,
      })}
    >
      {dark ? (
        content
      ) : (
        <GlassView
          glassEffectStyle="regular"
          isInteractive
          style={{ flex: 1, borderRadius: 32, overflow: 'hidden' }}
        >
          {content}
        </GlassView>
      )}
    </Pressable>
  );
}
