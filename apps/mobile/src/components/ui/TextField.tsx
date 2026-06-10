import { Glass } from './Glass';
import { forwardRef, type ReactNode } from 'react';
import {
  Text,
  TextInput as RNTextInput,
  View,
  type TextInputProps as RNTextInputProps,
  type ViewStyle,
} from 'react-native';
import { tokens } from '../../theme/colors';

interface Props extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  hint?: string;
  error?: boolean;
  focused?: boolean;
  containerStyle?: ViewStyle;
}

// Glass text input: blur+полупрозрачный белый, inset 1.5px border при фокусе/ошибке.
export const TextField = forwardRef<RNTextInput, Props>(function TextField(
  { label, prefix, suffix, hint, error, focused, containerStyle, ...rest },
  ref,
) {
  const ringColor = error
    ? tokens.red
    : focused
      ? 'rgba(20,20,20,0.32)'
      : tokens.hairline;
  const ringWidth = error || focused ? 1.5 : 1;

  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label && (
        <Text
          style={{
            fontFamily: 'Manrope_500Medium',
            fontSize: 13,
            color: tokens.inkMuted,
            letterSpacing: -0.065,
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          height: 60,
          borderRadius: 20,
          overflow: 'hidden',
        }}
      >
        <Glass intensity={20} tint="light" style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.5)' }}>
          <View
            style={{
              flex: 1,
              borderRadius: 20,
              borderWidth: ringWidth,
              borderColor: ringColor,
              paddingHorizontal: 18,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {prefix && <View>{prefix}</View>}
            <RNTextInput
              ref={ref}
              {...rest}
              placeholderTextColor="rgba(20,20,20,0.4)"
              style={{
                flex: 1,
                fontFamily: 'Manrope_500Medium',
                fontSize: 17,
                color: tokens.inkDark,
                letterSpacing: -0.085,
                padding: 0,
              }}
            />
            {suffix && <View>{suffix}</View>}
          </View>
        </Glass>
      </View>
      {hint && (
        <Text
          style={{
            fontFamily: 'Manrope_400Regular',
            fontSize: 12,
            color: error ? tokens.red : tokens.inkMuted,
            paddingLeft: 4,
          }}
        >
          {hint}
        </Text>
      )}
    </View>
  );
});
