import { Glass } from './Glass';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { tokens } from '../../theme/colors';

interface Props {
  icon: ReactNode;
  title: string;
  body: string;
}

// Большая строка-преимущество с круглой иконкой слева и текстом.
// Используется в секциях детальной страницы продукта (M4.2).
export function BenefitRow({ icon, title, body }: Props) {
  return (
    <View style={{ borderRadius: 20, overflow: 'hidden' }}>
      <Glass
        intensity={20}
        tint="light"
        style={{
          backgroundColor: 'rgba(255,255,255,0.5)',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingVertical: 14,
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.9)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              fontFamily: 'Manrope_600SemiBold',
              fontSize: 14,
              color: tokens.ink,
              letterSpacing: -0.07,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontFamily: 'Manrope_400Regular',
              fontSize: 13,
              color: tokens.inkMuted,
            }}
          >
            {body}
          </Text>
        </View>
      </Glass>
    </View>
  );
}
