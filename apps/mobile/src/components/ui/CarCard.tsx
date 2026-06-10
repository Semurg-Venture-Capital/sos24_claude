import { Glass } from './Glass';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { tokens } from '../../theme/colors';

interface Props {
  selected?: boolean;
  plate: string;
  name: string;
  year: number;
  engine: string;
  power: string;
  onPress?: () => void;
}

// Карточка авто в селекторе шага 1 калькулятора. Выбранная — тёмная,
// невыбранная — glass + кольцо-чекбокс справа.
export function CarCard({ selected, plate, name, year, engine, power, onPress }: Props) {
  const plateRegion = plate.split(' ')[0] ?? plate;

  const content = (
    <View
      style={{
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
      }}
    >
      {/* Region plate badge */}
      <View
        style={{
          width: 48,
          height: 36,
          borderRadius: 8,
          backgroundColor: selected ? 'rgba(255,255,255,0.12)' : '#fff',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: 'NeueMontreal-Medium',
            fontSize: 13,
            color: selected ? '#fff' : tokens.inkDark,
            letterSpacing: 0.52,
          }}
        >
          {plateRegion}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            fontFamily: 'NeueMontreal-Medium',
            fontSize: 16,
            color: selected ? '#fff' : tokens.ink,
            letterSpacing: -0.08,
          }}
        >
          {name}
        </Text>
        <Text
          style={{
            fontFamily: 'Manrope_400Regular',
            fontSize: 12,
            color: selected ? tokens.inkMutedDark : tokens.inkMuted,
          }}
        >
          {year} · {engine} · {power}
        </Text>
        <Text
          style={{
            fontFamily: 'NeueMontreal-Regular',
            fontSize: 13,
            color: selected ? 'rgba(255,255,255,0.7)' : tokens.inkSubtle,
            letterSpacing: 0.26,
          }}
        >
          {plate}
        </Text>
      </View>
      {/* Selection indicator */}
      {selected ? (
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            backgroundColor: tokens.red,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Svg width={11} height={9} viewBox="0 0 11 9" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M1 4.5l3 3 6-6.5" />
          </Svg>
        </View>
      ) : (
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.6)',
            borderWidth: 1,
            borderColor: tokens.hairline,
          }}
        />
      )}
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: selected ? tokens.inkDark : undefined,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: selected ? 0.32 : 0.05,
        shadowRadius: 16,
        elevation: 4,
        opacity: pressed ? 0.85 : 1,
        borderWidth: selected ? 0 : 1,
        borderColor: tokens.hairline,
      })}
    >
      {selected ? (
        content
      ) : (
        <Glass intensity={20} tint="light" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}>
          {content}
        </Glass>
      )}
    </Pressable>
  );
}
