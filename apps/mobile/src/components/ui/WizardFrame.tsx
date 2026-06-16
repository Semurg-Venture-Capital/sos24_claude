import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { BackButton } from './BackButton';
import { RedButton } from './RedButton';
import { StepperBar } from './StepperBar';
import { PhoneFrame } from './PhoneFrame';
import { tokens } from '../../theme/colors';

interface Props {
  step: number;
  total?: number;
  eyebrow?: string;
  children: ReactNode;
  primary?: string;
  primaryEnabled?: boolean;
  primaryAction?: () => void;
  onBack?: () => void;
}

// Каркас шага wizard: back + stepper сверху, скролл-контент, sticky CTA снизу.
// Используется для шагов калькулятора M5 и чекаута M6/M7.
export function WizardFrame({
  step,
  total = 4,
  eyebrow,
  children,
  primary = 'Далее',
  primaryEnabled = true,
  primaryAction,
  onBack,
}: Props) {
  return (
    <PhoneFrame>
      {/* Top: back + stepper */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 16,
        }}
      >
        <BackButton onPress={onBack} />
        <StepperBar current={step} total={total} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140, gap: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        {eyebrow && (
          <Text
            style={{
              fontFamily: 'Manrope_600SemiBold',
              fontSize: 11,
              color: tokens.inkMuted,
              letterSpacing: 0.88,
              textTransform: 'uppercase',
            }}
          >
            {eyebrow}
          </Text>
        )}
        {children}
      </ScrollView>

      {/* Sticky CTA */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <LinearGradient colors={['rgba(228,228,228,0)', 'rgba(228,228,228,0.95)']} style={{ height: 24 }} />
        <View
          style={{
            paddingHorizontal: 24,
            paddingBottom: 32,
            paddingTop: 8,
            backgroundColor: 'rgba(228,228,228,0.95)',
          }}
        >
          <RedButton onPress={primaryAction} disabled={!primaryEnabled}>
            {primary}
          </RedButton>
        </View>
      </View>
    </PhoneFrame>
  );
}
