import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

interface Props {
  title: string;
  badge: string;
  validUntil: string;
}

// Промо-баннер на Home: тёмный градиент + красное свечение в углу.
export function PromoBanner({ title, badge, validUntil }: Props) {
  return (
    <View
      style={{
        height: 140,
        borderRadius: 28,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <LinearGradient
        colors={['#2a1a2f', '#4a1830', '#6a1828']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {/* Red glow radial — fake via second gradient */}
      <LinearGradient
        colors={['rgba(230,20,40,0.4)', 'rgba(230,20,40,0)']}
        start={{ x: 1, y: 1 }}
        end={{ x: 0.3, y: 0.3 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View style={{ flex: 1, padding: 22, justifyContent: 'space-between' }}>
        <View style={{ gap: 4 }}>
          <Text
            style={{
              fontFamily: 'Manrope_400Regular',
              fontSize: 11,
              color: 'rgba(255,255,255,0.65)',
              letterSpacing: 0.88,
              textTransform: 'uppercase',
            }}
          >
            {badge}
          </Text>
          <Text
            style={{
              fontFamily: 'NeueMontreal-Medium',
              fontSize: 22,
              color: '#fff',
              letterSpacing: -0.22,
              lineHeight: 25,
            }}
          >
            {title}
          </Text>
        </View>
        <View
          style={{
            alignSelf: 'flex-start',
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.15)',
          }}
        >
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: '#fff' }}>
            {validUntil}
          </Text>
        </View>
      </View>
    </View>
  );
}
