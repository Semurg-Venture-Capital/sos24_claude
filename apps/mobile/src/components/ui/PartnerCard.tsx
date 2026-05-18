import { BlurView } from 'expo-blur';
import { Text, View } from 'react-native';
import { StarIcon } from '../icons/StarIcon';
import { tokens } from '../../theme/colors';

interface Props {
  name: string;
  type: string;
  rating: string;
  distance: string;
  open?: boolean;
}

export function PartnerCard({ name, type, rating, distance, open }: Props) {
  return (
    <View
      style={{
        width: 168,
        borderRadius: 28,
        overflow: 'hidden',
      }}
    >
      <BlurView
        intensity={20}
        tint="light"
        style={{
          backgroundColor: 'rgba(255,255,255,0.55)',
          padding: 14,
          gap: 8,
        }}
      >
        {/* Logo placeholder block */}
        <View
          style={{
            height: 80,
            borderRadius: 18,
            backgroundColor: '#d8d8d8',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 18, color: tokens.inkSubtle }}>
            {name[0]}
          </Text>
        </View>
        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: 'Manrope_600SemiBold',
                fontSize: 14,
                color: tokens.ink,
                flex: 1,
              }}
            >
              {name}
            </Text>
            {open && <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: tokens.green }} />}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <StarIcon size={10} />
              <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 11, color: tokens.inkMuted }}>
                {rating}
              </Text>
            </View>
            <Text style={{ color: tokens.inkMuted }}>·</Text>
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 11, color: tokens.inkMuted }}>
              {distance}
            </Text>
          </View>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 11, color: tokens.inkSubtle }}>
            {type}
          </Text>
        </View>
      </BlurView>
    </View>
  );
}
