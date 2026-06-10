import { Glass } from './Glass';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { tokens } from '../../theme/colors';

interface Props {
  question: string;
  answer?: string;
  defaultOpen?: boolean;
}

// Аккордеон-строка FAQ (M4.2). Хранит open-состояние локально.
export function FaqRow({ question, answer, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const canExpand = !!answer;

  return (
    <Pressable
      onPress={() => canExpand && setOpen((v) => !v)}
      style={({ pressed }) => ({
        borderRadius: 20,
        overflow: 'hidden',
        opacity: pressed && canExpand ? 0.85 : 1,
      })}
    >
      <Glass
        intensity={20}
        tint="light"
        style={{
          backgroundColor: 'rgba(255,255,255,0.5)',
          paddingVertical: 16,
          paddingHorizontal: 18,
          gap: open ? 8 : 0,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <Text
            style={{
              fontFamily: 'Manrope_500Medium',
              fontSize: 14,
              color: tokens.ink,
              letterSpacing: -0.07,
              flex: 1,
            }}
          >
            {question}
          </Text>
          <Svg
            width={14}
            height={14}
            viewBox="0 0 14 14"
            fill="none"
            stroke={tokens.inkMuted}
            strokeWidth={1.8}
            strokeLinecap="round"
            style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
          >
            <Path d="M3 5l4 4 4-4" />
          </Svg>
        </View>
        {open && answer && (
          <Text
            style={{
              fontFamily: 'Manrope_400Regular',
              fontSize: 13,
              color: tokens.inkMuted,
              lineHeight: 19,
            }}
          >
            {answer}
          </Text>
        )}
      </Glass>
    </Pressable>
  );
}
