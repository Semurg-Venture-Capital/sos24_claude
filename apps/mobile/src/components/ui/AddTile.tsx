import { Pressable, Text, View } from 'react-native';
import { PlusIcon } from '../icons/PlusIcon';
import { tokens } from '../../theme/colors';

interface Props {
  children: string;
  onPress?: () => void;
  height?: number;
}

// Универсальная «+ Добавить ...» плашка с пунктирной обводкой.
// Используется в шагах калькулятора и в каталоге авто.
export function AddTile({ children, onPress, height = 64 }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 20,
        height,
        paddingHorizontal: 18,
        borderWidth: 1.5,
        borderColor: 'rgba(20,20,20,0.18)',
        borderStyle: 'dashed',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <PlusIcon size={20} color={tokens.inkSubtle} strokeWidth={1.8} />
      <Text
        style={{
          fontFamily: 'Manrope_500Medium',
          fontSize: 15,
          color: tokens.inkSubtle,
          letterSpacing: -0.075,
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}
