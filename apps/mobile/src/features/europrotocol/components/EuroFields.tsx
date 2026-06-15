import { Pressable, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
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
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'characters' | 'words' | 'sentences';
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
        style={{
          minHeight: multiline ? 80 : 46,
          paddingHorizontal: 14,
          paddingVertical: 12,
          textAlignVertical: multiline ? 'top' : 'center',
          borderRadius: 14,
          borderWidth: 1,
          borderColor: tokens.hairline,
          backgroundColor: 'rgba(255,255,255,0.6)',
          fontFamily: 'Manrope_500Medium',
          fontSize: 15,
          color: tokens.inkDark,
        }}
      />
    </View>
  );
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
