import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { tokens } from '../../theme/colors';

interface Props {
  length?: number;
  value: string;
  onChange: (next: string) => void;
  onComplete?: (value: string) => void;
  error?: boolean;
  autoFocus?: boolean;
}

// 6-cell OTP input. Один скрытый TextInput собирает ввод, ячейки отображают
// текущие цифры. Тап по любой ячейке открывает клавиатуру.
export function OtpBoxes({
  length = 6,
  value,
  onChange,
  onComplete,
  error,
  autoFocus = true,
}: Props) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const focusIndex = Math.min(value.length, length - 1);

  useEffect(() => {
    if (value.length === length) onComplete?.(value);
  }, [value, length, onComplete]);

  const handle = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, length);
    onChange(digits);
  };

  return (
    <Pressable onPress={() => inputRef.current?.focus()}>
      <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
        {Array.from({ length }).map((_, i) => {
          const char = value[i] ?? '';
          const isActive = focused && i === focusIndex;
          const ringColor = error
            ? tokens.red
            : isActive
              ? tokens.red
              : char
                ? 'rgba(20,20,20,0.16)'
                : tokens.hairline;
          const ringWidth = isActive || error ? 2 : 1;
          return (
            <View
              key={i}
              style={{
                width: 48,
                height: 60,
                borderRadius: 16,
                overflow: 'hidden',
              }}
            >
              <BlurView intensity={20} tint="light" style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.5)' }}>
                <View
                  style={{
                    flex: 1,
                    borderRadius: 16,
                    borderWidth: ringWidth,
                    borderColor: ringColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'NeueMontreal-Medium',
                      fontSize: 24,
                      color: error ? tokens.red : tokens.inkDark,
                    }}
                  >
                    {char}
                  </Text>
                  {isActive && !char && (
                    <View
                      style={{
                        position: 'absolute',
                        width: 2,
                        height: 24,
                        backgroundColor: tokens.red,
                        borderRadius: 1,
                      }}
                    />
                  )}
                </View>
              </BlurView>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        autoFocus={autoFocus}
        value={value}
        onChangeText={handle}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        maxLength={length}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 1,
          height: 1,
        }}
      />
    </Pressable>
  );
}
