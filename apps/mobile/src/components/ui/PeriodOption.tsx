import { BlurView } from 'expo-blur';
import { Pressable, Text, View } from 'react-native';
import { tokens } from '../../theme/colors';

interface Props {
  label: string;
  sub: string;
  selected?: boolean;
  onPress?: () => void;
}

// Опция периода страхования (шаг 3 калькулятора). Tile-pill,
// выбранная — тёмная, остальные — glass.
export function PeriodOption({ label, sub, selected, onPress }: Props) {
  const content = (
    <View
      style={{
        paddingVertical: 16,
        paddingHorizontal: 12,
        alignItems: 'center',
        gap: 4,
      }}
    >
      <Text
        style={{
          fontFamily: 'NeueMontreal-Medium',
          fontSize: 15,
          color: selected ? '#fff' : tokens.ink,
          letterSpacing: -0.075,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: 'Manrope_600SemiBold',
          fontSize: 11,
          color: selected ? tokens.green : tokens.inkMuted,
          letterSpacing: 0.22,
        }}
      >
        {sub}
      </Text>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: selected ? tokens.inkDark : undefined,
        borderWidth: selected ? 0 : 1,
        borderColor: tokens.hairline,
        opacity: pressed ? 0.85 : 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: selected ? 0.3 : 0,
        shadowRadius: 16,
        elevation: selected ? 4 : 0,
      })}
    >
      {selected ? content : <BlurView intensity={20} tint="light" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}>{content}</BlurView>}
    </Pressable>
  );
}
