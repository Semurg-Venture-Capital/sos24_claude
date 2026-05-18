import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { tokens } from '../../theme/colors';

interface Props {
  children: ReactNode;
  onPress?: () => void;
  badge?: boolean;
}

export function IconButton({ children, onPress, badge }: Props) {
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
        {children}
        {badge && (
          <View
            style={{
              position: 'absolute',
              top: 10,
              right: 12,
              width: 10,
              height: 10,
              borderRadius: 999,
              backgroundColor: tokens.red,
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.9)',
            }}
          />
        )}
      </BlurView>
    </Pressable>
  );
}
