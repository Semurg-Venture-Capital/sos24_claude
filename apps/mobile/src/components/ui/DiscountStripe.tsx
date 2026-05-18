import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

interface Props {
  title: string;
  hint: string;
}

// Жёлтая промо-полоска со знаком % (M4.1 каталог). Отличается от
// тёмного PromoBanner на Home.
export function DiscountStripe({ title, hint }: Props) {
  return (
    <View
      style={{
        borderRadius: 28,
        overflow: 'hidden',
        marginTop: 6,
      }}
    >
      <LinearGradient
        colors={['rgba(245,200,80,0.4)', 'rgba(245,200,80,0.18)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          padding: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            backgroundColor: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: 'rgba(180,140,40,0.4)',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text
            style={{
              fontFamily: 'NeueMontreal-Medium',
              fontSize: 18,
              color: '#503a07',
              lineHeight: 20,
            }}
          >
            %
          </Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              fontFamily: 'Manrope_600SemiBold',
              fontSize: 14,
              color: '#3a2a07',
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontFamily: 'Manrope_400Regular',
              fontSize: 12,
              color: '#5e4811',
            }}
          >
            {hint}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}
