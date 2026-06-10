import { Glass } from './Glass';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { tokens } from '../../theme/colors';

export type CardBrand = 'uzcard' | 'humo';

interface Props {
  brand: CardBrand;
  last4: string;
  expiry: string;
  selected?: boolean;
  onPress?: () => void;
}

const brandColors: Record<CardBrand, string> = {
  uzcard: '#0099d8',
  humo: '#0a8a3a',
};

const brandLabels: Record<CardBrand, string> = {
  uzcard: 'Uzcard',
  humo: 'Humo',
};

// Опция сохранённой карты в оплате (M7.1).
export function CardOption({ brand, last4, expiry, selected, onPress }: Props) {
  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        paddingHorizontal: 18,
      }}
    >
      {/* Brand badge */}
      <View
        style={{
          width: 44,
          height: 30,
          borderRadius: 7,
          backgroundColor: selected ? 'rgba(255,255,255,0.08)' : '#fff',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: 'NeueMontreal-Bold',
            fontSize: 11,
            color: brandColors[brand],
            letterSpacing: 0.22,
          }}
        >
          {brandLabels[brand]}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            fontFamily: 'NeueMontreal-Medium',
            fontSize: 15,
            color: selected ? '#fff' : tokens.ink,
            letterSpacing: 0.6,
          }}
        >
          •••• {last4}
        </Text>
        <Text
          style={{
            fontFamily: 'Manrope_400Regular',
            fontSize: 11,
            color: selected ? tokens.inkMutedDark : tokens.inkMuted,
          }}
        >
          {brandLabels[brand]} · до {expiry}
        </Text>
      </View>
      {/* Selection radio */}
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          backgroundColor: selected ? tokens.red : 'rgba(255,255,255,0.6)',
          borderWidth: selected ? 0 : 1,
          borderColor: tokens.hairline,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && (
          <Svg width={11} height={9} viewBox="0 0 11 9" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M1 4.5l3 3 6-6.5" />
          </Svg>
        )}
      </View>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 22,
        overflow: 'hidden',
        backgroundColor: selected ? tokens.inkDark : undefined,
        borderWidth: selected ? 0 : 1,
        borderColor: tokens.hairline,
        opacity: pressed ? 0.85 : 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: selected ? 0.32 : 0.05,
        shadowRadius: 16,
        elevation: selected ? 4 : 0,
      })}
    >
      {selected ? content : <Glass intensity={20} tint="light" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}>{content}</Glass>}
    </Pressable>
  );
}
