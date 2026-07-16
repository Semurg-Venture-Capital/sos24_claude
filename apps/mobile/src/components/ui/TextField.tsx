import { Glass } from './Glass';
import { forwardRef, useId, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  Text,
  TextInput as RNTextInput,
  View,
  type TextInputProps as RNTextInputProps,
  type ViewStyle,
} from 'react-native';
import { tokens } from '../../theme/colors';

// Числовые клавиатуры на iOS не имеют кнопки возврата → нужен аксессори «Готово».
const NUMERIC_KB = ['number-pad', 'decimal-pad', 'numeric', 'phone-pad'];

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
  const { t } = useTranslation();
  const ringColor = error
    ? tokens.red
    : focused
      ? 'rgba(20,20,20,0.32)'
      : tokens.hairline;
  const ringWidth = error || focused ? 1.5 : 1;

  // Для числовых клавиатур на iOS вешаем панель «Готово» (иначе клавиатуру не закрыть).
  const reactId = useId();
  const accessoryId = `kbd-done-${reactId}`;
  const numericKb = Platform.OS === 'ios' && NUMERIC_KB.includes(String(rest.keyboardType ?? ''));

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
              inputAccessoryViewID={numericKb ? accessoryId : rest.inputAccessoryViewID}
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
      {numericKb && (
        <InputAccessoryView nativeID={accessoryId}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
              backgroundColor: '#f2f2f7',
              borderTopWidth: 1,
              borderTopColor: 'rgba(0,0,0,0.12)',
              paddingHorizontal: 16,
              paddingVertical: 9,
            }}
          >
            <Pressable onPress={() => Keyboard.dismiss()} hitSlop={10}>
              <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 16, color: tokens.red }}>{t('ui.done')}</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
    </View>
  );
});
