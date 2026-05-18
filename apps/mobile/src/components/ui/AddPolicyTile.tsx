import { Pressable, Text, View } from 'react-native';
import { PlusIcon } from '../icons/PlusIcon';
import { tokens } from '../../theme/colors';

interface Props {
  onPress?: () => void;
}

export function AddPolicyTile({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 200,
        height: 200,
        borderRadius: 32,
        borderWidth: 1.5,
        borderColor: 'rgba(20,20,20,0.16)',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 18,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <PlusIcon size={24} color={tokens.inkSubtle} />
      <Text
        style={{
          fontFamily: 'Manrope_500Medium',
          fontSize: 13,
          textAlign: 'center',
          color: tokens.inkSubtle,
        }}
      >
        Оформить{'\n'}новый полис
      </Text>
    </Pressable>
  );
}
