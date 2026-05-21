import { GlassView } from 'expo-glass-effect';
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
    <View
      style={{
        borderRadius: 999,
        shadowColor: 'rgb(201,201,201)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          width: 48,
          height: 48,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <GlassView
          glassEffectStyle="regular"
          isInteractive
          style={{
            flex: 1,
            borderRadius: 999,
            overflow: 'hidden',
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
        </GlassView>
      </Pressable>
    </View>
  );
}
