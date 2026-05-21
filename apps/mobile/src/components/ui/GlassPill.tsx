import { GlassView } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
}

// Glass-капсула — iOS 26 Liquid Glass через expo-glass-effect.
// borderRadius + overflow стоят на самом GlassView, иначе glass рендерится
// прямоугольником и обрезается родителем (артефакт «белый фон по бокам»).
// Внешний wrapper — только shadow.
export function GlassPill({ children, style }: Props) {
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
      <GlassView
        glassEffectStyle="regular"
        style={[
          {
            borderRadius: 999,
            overflow: 'hidden',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 14,
            paddingVertical: 8,
          },
          style,
        ]}
      >
        {children}
      </GlassView>
    </View>
  );
}
