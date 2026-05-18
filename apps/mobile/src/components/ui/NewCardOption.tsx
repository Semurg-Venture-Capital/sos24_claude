import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from '../icons/ChevronRight';
import { PlusIcon } from '../icons/PlusIcon';
import { tokens } from '../../theme/colors';

interface Props {
  onPress?: () => void;
}

// Опция «Новая карта» с пунктирной обводкой (M7.1).
export function NewCardOption({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        paddingHorizontal: 18,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: 'rgba(20,20,20,0.16)',
        borderStyle: 'dashed',
        backgroundColor: 'transparent',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View
        style={{
          width: 44,
          height: 30,
          borderRadius: 7,
          backgroundColor: 'rgba(20,20,20,0.04)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <PlusIcon size={14} color={tokens.inkSubtle} />
      </View>
      <Text
        style={{
          flex: 1,
          fontFamily: 'Manrope_500Medium',
          fontSize: 15,
          color: tokens.inkDark,
          letterSpacing: -0.075,
        }}
      >
        Новая карта
      </Text>
      <ChevronRight size={12} />
    </Pressable>
  );
}
