import { BlurView } from 'expo-blur';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { tokens } from '../../theme/colors';

interface Row {
  label: string;
  value: string;
}

interface Props {
  eyebrow?: string;
  rows: Row[];
  editable?: boolean;
  onEdit?: () => void;
}

// Блок информации — eyebrow-заголовок + строки label/value через
// разделитель. Используется на M8.2 (детали полиса), будет нужен и
// на M6 чекауте.
export function SummaryBlock({ eyebrow, rows, editable, onEdit }: Props) {
  return (
    <View
      style={{
        borderRadius: 24,
        overflow: 'hidden',
      }}
    >
      <BlurView
        intensity={20}
        tint="light"
        style={{
          backgroundColor: 'rgba(255,255,255,0.55)',
          padding: 18,
          gap: 12,
        }}
      >
        {(eyebrow || editable) && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {eyebrow && (
              <Text
                style={{
                  fontFamily: 'Manrope_500Medium',
                  fontSize: 11,
                  color: tokens.inkSubtle,
                  letterSpacing: 0.88,
                  textTransform: 'uppercase',
                }}
              >
                {eyebrow}
              </Text>
            )}
            {editable && (
              <Pressable onPress={onEdit} hitSlop={8}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.inkSubtle }}>
                    Изменить
                  </Text>
                  <Svg width={6} height={10} viewBox="0 0 6 10" fill="none" stroke={tokens.inkSubtle} strokeWidth={1.6} strokeLinecap="round">
                    <Path d="M1 1l4 4-4 4" />
                  </Svg>
                </View>
              </Pressable>
            )}
          </View>
        )}
        <View style={{ gap: 10 }}>
          {rows.map((r, i) => (
            <View key={i}>
              {i > 0 && (
                <View
                  style={{
                    height: 1,
                    backgroundColor: tokens.hairline,
                    marginBottom: 10,
                  }}
                />
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted }}>
                  {r.label}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Manrope_500Medium',
                    fontSize: 13,
                    color: tokens.inkDark,
                    textAlign: 'right',
                  }}
                >
                  {r.value}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </BlurView>
    </View>
  );
}
