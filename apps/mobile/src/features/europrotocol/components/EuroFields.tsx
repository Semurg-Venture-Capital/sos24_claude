import { useState } from 'react';
import { Pressable, Text, TextInput, View, type KeyboardTypeOptions, type ViewStyle } from 'react-native';
import { TextField } from '../../../components/ui/TextField';
import { tokens } from '../../../theme/colors';

// Подпись секции (как в EuroStep3).
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.inkMuted, letterSpacing: -0.07, marginTop: 6 }}>
      {children}
    </Text>
  );
}

// Поле ввода с подписью.
export function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  autoCapitalize,
  maxLength,
  error,
  hint,
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'characters' | 'words' | 'sentences';
  maxLength?: number;
  error?: string | null;
  hint?: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12.5, color: tokens.inkMuted, paddingLeft: 2 }}>{label}</Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(20,20,20,0.35)"
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        style={{
          minHeight: multiline ? 80 : 46,
          paddingHorizontal: 14,
          paddingVertical: 12,
          textAlignVertical: multiline ? 'top' : 'center',
          borderRadius: 14,
          borderWidth: 1,
          borderColor: error ? tokens.red : tokens.hairline,
          backgroundColor: 'rgba(255,255,255,0.6)',
          fontFamily: 'Manrope_500Medium',
          fontSize: 15,
          color: tokens.inkDark,
        }}
      />
      {error ? (
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 11.5, color: tokens.red, paddingLeft: 2 }}>{error}</Text>
      ) : hint ? (
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 11.5, color: tokens.inkSubtle, paddingLeft: 2 }}>{hint}</Text>
      ) : null}
    </View>
  );
}

// Поле даты с маской ДД.ММ.ГГГГ (на общем Glass-TextField). Хранит ISO (YYYY-MM-DD),
// пусто если дата неполная/невалидна. Подходит для рядов рядом с другими TextField.
export function DateField({
  label,
  value,
  onChange,
  placeholder = 'ДД.ММ.ГГГГ',
  containerStyle,
}: {
  label?: string;
  value: string; // ISO YYYY-MM-DD или ''
  onChange: (iso: string) => void;
  placeholder?: string;
  containerStyle?: ViewStyle;
}) {
  const seed = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.slice(8, 10) + value.slice(5, 7) + value.slice(0, 4) : '';
  const [digits, setDigits] = useState(seed);
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  const formatted = [dd, mm, yyyy].filter((x) => x.length).join('.');
  const complete = digits.length === 8;
  const valid = complete && +dd >= 1 && +dd <= 31 && +mm >= 1 && +mm <= 12 && +yyyy >= 1950 && +yyyy <= 2100;

  const handle = (t: string) => {
    const d = t.replace(/\D/g, '').slice(0, 8);
    setDigits(d);
    const _dd = d.slice(0, 2), _mm = d.slice(2, 4), _yy = d.slice(4, 8);
    const ok = d.length === 8 && +_dd >= 1 && +_dd <= 31 && +_mm >= 1 && +_mm <= 12 && +_yy >= 1950 && +_yy <= 2100;
    onChange(ok ? `${_yy}-${_mm}-${_dd}` : '');
  };

  return (
    <TextField
      label={label}
      value={formatted}
      onChangeText={handle}
      placeholder={placeholder}
      keyboardType="number-pad"
      maxLength={10}
      error={complete && !valid}
      hint={complete && !valid ? 'Некорректная дата' : undefined}
      containerStyle={containerStyle}
    />
  );
}

// Селектор зоны первого удара (8 зон). Хранит код зоны.
export const IMPACT_ZONES: { key: string; label: string }[] = [
  { key: 'front', label: 'Перёд' },
  { key: 'rear', label: 'Зад' },
  { key: 'left', label: 'Левый бок' },
  { key: 'right', label: 'Правый бок' },
  { key: 'front-left', label: 'Перёд-лево' },
  { key: 'front-right', label: 'Перёд-право' },
  { key: 'rear-left', label: 'Зад-лево' },
  { key: 'rear-right', label: 'Зад-право' },
];

export function ZoneSelect({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: string | null;
  onChange: (v: string) => void;
}) {
  return <Segmented label={label} value={value} options={IMPACT_ZONES} onChange={onChange} />;
}

// Переключатель Ҳа/Йўқ (value: true | false | null).
export function YesNoToggle({
  label,
  value,
  onChange,
  yes = 'Ҳа',
  no = 'Йўқ',
}: {
  label?: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
  yes?: string;
  no?: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12.5, color: tokens.inkMuted, paddingLeft: 2 }}>{label}</Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pill active={value === true} label={yes} onPress={() => onChange(true)} />
        <Pill active={value === false} label={no} onPress={() => onChange(false)} />
      </View>
    </View>
  );
}

// Сегмент из произвольных вариантов (для driverRole и т.п.).
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: T | null;
  options: { key: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12.5, color: tokens.inkMuted, paddingLeft: 2 }}>{label}</Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {options.map((o) => (
          <Pill key={o.key} active={value === o.key} label={o.label} onPress={() => onChange(o.key)} />
        ))}
      </View>
    </View>
  );
}

function Pill({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexGrow: 1,
        paddingVertical: 11,
        paddingHorizontal: 14,
        borderRadius: 14,
        alignItems: 'center',
        backgroundColor: active ? tokens.inkDark : 'rgba(255,255,255,0.6)',
        borderWidth: 1,
        borderColor: active ? tokens.inkDark : tokens.hairline,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: active ? '#fff' : tokens.inkDark }}>{label}</Text>
    </Pressable>
  );
}
