import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { tokens } from '../../theme/colors';

export interface ProductBenefit {
  icon: ReactNode;
  label: string;
}

interface Props {
  tone?: 'light' | 'dark';
  eyebrow: string;
  name: string;
  subtitle: string;
  benefits: ProductBenefit[];
  price: string;
  cta?: string;
  onPress?: () => void;
}

// Карточка продукта в каталоге M4.1: eyebrow + name + price + subtitle
// + 3 benefit-строки с иконками + красная CTA-кнопка.
export function ProductCard({
  tone = 'light',
  eyebrow,
  name,
  subtitle,
  benefits,
  price,
  cta = 'Рассчитать',
  onPress,
}: Props) {
  const dark = tone === 'dark';
  const ink = dark ? '#fff' : tokens.ink;
  const muted = dark ? tokens.inkMutedDark : tokens.inkMuted;
  const eyebrowColor = dark ? 'rgba(255,255,255,0.5)' : tokens.inkMuted;

  const content = (
    <View style={{ padding: 22, gap: 16 }}>
      {/* Top — eyebrow + name (left) + price (right) */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text
            style={{
              fontFamily: 'Manrope_600SemiBold',
              fontSize: 11,
              color: eyebrowColor,
              letterSpacing: 0.88,
              textTransform: 'uppercase',
            }}
          >
            {eyebrow}
          </Text>
          <Text
            style={{
              fontFamily: 'NeueMontreal-Medium',
              fontSize: 32,
              letterSpacing: -0.64,
              color: ink,
              lineHeight: 34,
            }}
          >
            {name}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 11, color: muted }}>от</Text>
          <Text
            style={{
              fontFamily: 'NeueMontreal-Medium',
              fontSize: 22,
              letterSpacing: -0.22,
              color: ink,
              lineHeight: 24,
            }}
          >
            {price}
          </Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 11, color: muted }}>сум / год</Text>
        </View>
      </View>

      <Text
        style={{
          fontFamily: 'Manrope_400Regular',
          fontSize: 13,
          color: muted,
          lineHeight: 18,
        }}
      >
        {subtitle}
      </Text>

      {/* Benefits */}
      <View style={{ gap: 12, marginTop: 2 }}>
        {benefits.map((b, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {b.icon}
            </View>
            <Text
              style={{
                fontFamily: 'Manrope_400Regular',
                fontSize: 14,
                color: dark ? tokens.inkMutedDark : tokens.ink,
                flex: 1,
                letterSpacing: -0.07,
              }}
            >
              {b.label}
            </Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          marginTop: 8,
          height: 64,
          borderRadius: 999,
          backgroundColor: tokens.red,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          shadowColor: tokens.red,
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.5,
          shadowRadius: 20,
          elevation: 8,
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <Text
          style={{
            color: '#fff',
            fontFamily: 'Manrope_700Bold',
            fontSize: 16,
            letterSpacing: -0.16,
          }}
        >
          {cta}
        </Text>
        <Svg width={7} height={10} viewBox="0 0 7 10" fill="#fff">
          <Path d="M.833 0L0 .833 4.167 5 0 9.167.833 10l5-5z" />
        </Svg>
      </Pressable>
    </View>
  );

  return (
    <View
      style={{
        borderRadius: 36,
        overflow: 'hidden',
        backgroundColor: dark ? tokens.inkDark : undefined,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: dark ? 0.32 : 0.1,
        shadowRadius: 24,
        elevation: 4,
      }}
    >
      {dark ? content : <BlurView intensity={20} tint="light" style={{ backgroundColor: 'rgba(255,255,255,0.55)' }}>{content}</BlurView>}
    </View>
  );
}
