import { GlassView } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { tokens } from '../../theme/colors';

interface Props {
  icon: ReactNode;
  label: string;
  dark?: boolean;
  onPress?: () => void;
}

// Tile быстрых действий 2×2 на Home. Поддерживает \n в label для двух строк.
export function ActionTile({ icon, label, dark, onPress }: Props) {
  const content = (
    <View
      style={{
        flex: 1,
        padding: 20,
        paddingTop: 18,
        gap: 8,
      }}
    >
      <View style={{ width: 40, height: 40, justifyContent: 'center' }}>{icon}</View>
      <Text
        style={{
          fontFamily: 'Manrope_700Bold',
          fontSize: 16,
          lineHeight: 19,
          letterSpacing: -0.16,
          color: dark ? '#fff' : tokens.ink,
          marginTop: 'auto',
        }}
      >
        {label}
      </Text>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        height: 142,
        borderRadius: 32,
        overflow: 'hidden',
        opacity: pressed ? 0.85 : 1,
        backgroundColor: dark ? tokens.inkDark : undefined,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: dark ? 0.12 : 0.05,
        shadowRadius: 12,
        elevation: 2,
      })}
    >
      {dark ? (
        content
      ) : (
        <GlassView
          glassEffectStyle="regular"
          isInteractive
          style={{ flex: 1, borderRadius: 32, overflow: 'hidden' }}
        >
          {content}
        </GlassView>
      )}
    </Pressable>
  );
}
