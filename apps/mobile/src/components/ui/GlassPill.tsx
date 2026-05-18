import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

// Glass-капсула из design system: blur + полупрозрачный белый + soft shadow.
// На native платформах BlurView даёт настоящий backdrop-filter эффект.
export function GlassPill({ children, style, intensity = 32 }: Props) {
  return (
    <View
      style={[
        {
          borderRadius: 999,
          overflow: 'hidden',
          shadowColor: 'rgb(201,201,201)',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 2,
        },
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint="light"
        style={{
          backgroundColor: 'rgba(255,255,255,0.5)',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 14,
          paddingVertical: 8,
        }}
      >
        {children}
      </BlurView>
    </View>
  );
}
