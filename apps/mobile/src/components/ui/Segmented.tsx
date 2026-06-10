import { Glass } from './Glass';
import { Pressable, Text, View } from 'react-native';
import { tokens } from '../../theme/colors';

interface Props {
  options: string[];
  active: number;
  onChange?: (index: number) => void;
}

export function Segmented({ options, active, onChange }: Props) {
  return (
    <View
      style={{
        height: 48,
        borderRadius: 999,
        overflow: 'hidden',
      }}
    >
      <Glass
        intensity={20}
        tint="light"
        style={{
          flex: 1,
          backgroundColor: 'rgba(255,255,255,0.5)',
          flexDirection: 'row',
          gap: 4,
          padding: 4,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: tokens.hairline,
        }}
      >
        {options.map((label, i) => (
          <Pressable
            key={label}
            onPress={() => onChange?.(i)}
            style={{
              flex: 1,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: i === active ? tokens.inkDark : 'transparent',
            }}
          >
            <Text
              style={{
                color: i === active ? '#FFFFFF' : 'rgba(20,20,20,0.6)',
                fontFamily: 'Manrope_600SemiBold',
                fontSize: 13,
                letterSpacing: -0.065,
              }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </Glass>
    </View>
  );
}
