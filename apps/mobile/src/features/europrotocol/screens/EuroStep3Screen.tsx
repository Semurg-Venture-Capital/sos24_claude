import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, Text, TextInput, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { Glass } from '../../../components/ui/Glass';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { WizardFrame } from '../../../components/ui/WizardFrame';
import { tokens } from '../../../theme/colors';
import { useEuroStore, type SchemeType } from '../store';
import type { EuroStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<EuroStackParamList, 'EuroStep3'>;

const SCHEMES: { key: SchemeType; label: string; Illu: () => React.ReactElement }[] = [
  { key: 'rear', label: 'Наезд сзади', Illu: SchemeRear },
  { key: 'front', label: 'Лобовое', Illu: SchemeFront },
  { key: 'side', label: 'Боковое', Illu: SchemeSide },
];

// M9.3 шаг 3 — схема столкновения (шаблон) + описание обстоятельств своими словами.
export function EuroStep3Screen() {
  const nav = useNavigation<Nav>();
  const { schemeType, description, setScheme, setDescription } = useEuroStore();

  return (
    <WizardFrame
      step={3}
      total={5}
      eyebrow="Шаг 3 из 5 · Схема"
      primary="Далее"
      primaryEnabled={!!schemeType}
      primaryAction={() => nav.navigate('EuroStep4')}
      onBack={() => nav.goBack()}
    >
      <ScreenHeading title="Схема столкновения" subtitle="Выберите подходящий шаблон и опишите, как произошло ДТП" />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        {SCHEMES.map((s) => (
          <SchemeOption
            key={s.key}
            label={s.label}
            selected={schemeType === s.key}
            onPress={() => setScheme(s.key)}
            illu={<s.Illu />}
          />
        ))}
      </View>

      <View style={{ gap: 10, marginTop: 4 }}>
        <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.inkMuted, letterSpacing: -0.07 }}>
          Описание обстоятельств
        </Text>
        <View style={{ borderRadius: 20, overflow: 'hidden' }}>
          <Glass intensity={20} tint="light" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Опишите, как произошло ДТП: направление движения, кто кого ударил, погодные условия…"
              placeholderTextColor="rgba(20,20,20,0.4)"
              multiline
              style={{
                minHeight: 120,
                padding: 16,
                textAlignVertical: 'top',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: tokens.hairline,
                fontFamily: 'Manrope_500Medium',
                fontSize: 15,
                lineHeight: 21,
                color: tokens.inkDark,
              }}
            />
          </Glass>
        </View>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkSubtle, lineHeight: 17, paddingLeft: 4 }}>
          Текст войдёт в извещение о ДТП. Чем точнее — тем быстрее рассмотрят выплату.
        </Text>
      </View>
    </WizardFrame>
  );
}

function SchemeOption({
  label,
  selected,
  onPress,
  illu,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  illu: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        borderRadius: 18,
        padding: 12,
        gap: 8,
        alignItems: 'center',
        backgroundColor: selected ? tokens.inkDark : 'rgba(255,255,255,0.55)',
        borderWidth: 1,
        borderColor: selected ? tokens.inkDark : tokens.hairline,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}>{illu}</View>
      <Text
        style={{
          fontFamily: 'Manrope_500Medium',
          fontSize: 11,
          color: selected ? '#fff' : tokens.inkDark,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Мини-иллюстрации схем (currentColor наследуется от текста родителя — задаём явно).
function SchemeRear() {
  return (
    <Svg width={60} height={40} viewBox="0 0 60 40" fill="none" stroke={tokens.inkDark} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={6} y={14} width={22} height={14} rx={3} />
      <Rect x={32} y={14} width={22} height={14} rx={3} />
      <Path d="M30 18l-2 3 2 3" stroke={tokens.red} strokeWidth={2} />
    </Svg>
  );
}
function SchemeFront() {
  return (
    <Svg width={60} height={40} viewBox="0 0 60 40" fill="none" stroke={tokens.inkDark} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={6} y={14} width={22} height={14} rx={3} />
      <Rect x={32} y={14} width={22} height={14} rx={3} />
      <Path d="M28 21h4" stroke={tokens.red} strokeWidth={2.5} />
    </Svg>
  );
}
function SchemeSide() {
  return (
    <Svg width={40} height={44} viewBox="0 0 40 44" fill="none" stroke={tokens.inkDark} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={10} y={4} width={20} height={14} rx={3} />
      <Rect x={10} y={26} width={20} height={14} rx={3} />
      <Path d="M20 20v4" stroke={tokens.red} strokeWidth={2.5} />
    </Svg>
  );
}
