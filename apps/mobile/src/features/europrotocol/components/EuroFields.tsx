import { useState } from 'react';
import { Modal, Platform, Pressable, Text, TextInput, View, type KeyboardTypeOptions, type ViewStyle } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
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

// Поле даты с НАТИВНЫМ выбором (iOS — спиннер в модалке, Android — системный диалог).
// Хранит ISO (YYYY-MM-DD).
function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Выберите дату',
  containerStyle,
}: {
  label?: string;
  value: string; // ISO YYYY-MM-DD или ''
  onChange: (iso: string) => void;
  placeholder?: string;
  containerStyle?: ViewStyle;
}) {
  const [open, setOpen] = useState(false);
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const dateVal = valid ? new Date(`${value}T00:00:00`) : new Date(2000, 0, 1);
  const display = valid ? `${value.slice(8, 10)}.${value.slice(5, 7)}.${value.slice(0, 4)}` : '';

  const onNative = (event: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
      if (event.type === 'set' && d) onChange(toISO(d));
    } else if (d) {
      onChange(toISO(d)); // iOS-спиннер обновляет вживую
    }
  };

  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label ? (
        <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12.5, color: tokens.inkMuted, paddingLeft: 2 }}>{label}</Text>
      ) : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          minHeight: 46,
          paddingHorizontal: 14,
          justifyContent: 'center',
          borderRadius: 14,
          borderWidth: 1,
          borderColor: tokens.hairline,
          backgroundColor: 'rgba(255,255,255,0.6)',
        }}
      >
        <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 15, color: display ? tokens.inkDark : 'rgba(20,20,20,0.35)' }}>
          {display || placeholder}
        </Text>
      </Pressable>

      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setOpen(false)}>
            <Pressable style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 12 }}>
              <DateTimePicker value={dateVal} mode="date" display="spinner" locale="ru-RU" onChange={onNative} />
              <Pressable
                onPress={() => setOpen(false)}
                style={{ alignSelf: 'flex-end', paddingHorizontal: 18, paddingVertical: 10 }}
              >
                <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 16, color: tokens.red }}>Готово</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      ) : open ? (
        <DateTimePicker value={dateVal} mode="date" display="default" onChange={onNative} />
      ) : null}
    </View>
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
