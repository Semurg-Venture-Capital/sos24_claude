import { Pressable, View } from 'react-native';
import { PlusIcon } from '../icons/PlusIcon';
import { tokens } from '../../theme/colors';

interface Props {
  onPress?: () => void;
  bottom?: number;
}

// Плавающая красная кнопка «+» (M3.1 для добавления авто).
export function FAB({ onPress, bottom = 100 }: Props) {
  return (
    <View
      style={{
        position: 'absolute',
        right: 24,
        bottom,
        shadowColor: tokens.red,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.45,
        shadowRadius: 20,
        elevation: 10,
      }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          width: 60,
          height: 60,
          borderRadius: 999,
          backgroundColor: tokens.red,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <PlusIcon size={26} color="#fff" strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}
