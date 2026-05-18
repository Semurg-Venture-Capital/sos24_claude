import { BlurView } from 'expo-blur';
import { Pressable, View } from 'react-native';
import { BackArrow } from '../icons/BackArrow';
import { tokens } from '../../theme/colors';

interface Props {
  onPress?: () => void;
}

export function BackButton({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 48,
        height: 48,
        borderRadius: 999,
        overflow: 'hidden',
        opacity: pressed ? 0.7 : 1,
        shadowColor: 'rgb(201,201,201)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 2,
      })}
    >
      <BlurView
        intensity={32}
        tint="light"
        style={{
          flex: 1,
          backgroundColor: 'rgba(255,255,255,0.5)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ marginRight: 2 }}>
          <BackArrow size={16} color={tokens.inkDark} />
        </View>
      </BlurView>
    </Pressable>
  );
}
