import { Pressable, View } from 'react-native';
import { tokens } from '../../theme/colors';

interface Props {
  value: boolean;
  onChange?: (next: boolean) => void;
}

// Toggle (switch) в ink-стиле. Активный — тёмный фон, белый кружок вправо.
export function Toggle({ value, onChange }: Props) {
  return (
    <Pressable
      onPress={() => onChange?.(!value)}
      hitSlop={6}
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        padding: 2,
        backgroundColor: value ? tokens.inkDark : 'rgba(20,20,20,0.16)',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          backgroundColor: '#fff',
          transform: [{ translateX: value ? 18 : 0 }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.18,
          shadowRadius: 4,
          elevation: 2,
        }}
      />
    </Pressable>
  );
}
